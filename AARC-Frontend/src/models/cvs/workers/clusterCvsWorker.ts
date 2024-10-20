import { ControlPoint, ControlPointDir, ControlPointSta } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { isZero, lessThanOrEqualTo } from "@/utils/sgn";
import { numberCmpEpsilon } from '@/utils/consts'
import { coordDistSqLessThan } from "@/utils/coordUtils/coordDist";
import { Coord } from "@/models/coord";

export function useClusterCvsWorker(){
    const saveStore = useSaveStore()
    const cs = useConfigStore()

    function renderClusters(ctx:CanvasRenderingContext2D){
        const crys = findAllCrystals()
        if(!crys)
            return;
        const forEachPoly = (doSth:()=>void)=>{
            for(const cry of crys){
                ctx.beginPath();
                const firstPos = cry[0]
                ctx.moveTo(firstPos[0], firstPos[1])
                for(let i=1;i<cry.length;i++){
                    ctx.lineTo(cry[i][0], cry[i][1])
                }
                ctx.closePath()
                doSth()
            }
        }
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        const rectLineWidth = (cs.config.ptStaSize + cs.config.ptStaLineWidth)* 2
        const bgColor = cs.config.bgColor;
        const exchangeColor = cs.config.ptStaExchangeLineColor;
        ctx.lineWidth = rectLineWidth + cs.config.ptStaLineWidth
        ctx.strokeStyle = bgColor
        forEachPoly(()=>{
            ctx.stroke()
        })
            
        ctx.lineWidth = rectLineWidth
        ctx.strokeStyle = exchangeColor
        forEachPoly(() => {
            ctx.stroke()
        })
        ctx.lineWidth = rectLineWidth - cs.config.ptStaLineWidth*2
        ctx.strokeStyle = cs.config.ptStaFillColor
        ctx.fillStyle = cs.config.ptStaFillColor
        forEachPoly(() => {
            ctx.fill()
            ctx.stroke()
        })
    }

    //同样朝向且紧挨着的控制点，会被汇总为一个“晶体”，用一个矩形覆盖
    function findAllCrystals():Coord[][]|undefined{
        const pts = saveStore.save?.points.filter(pt=>pt.sta == ControlPointSta.sta)
        if(!pts)
            return;
        const crys:ControlPoint[][] = []
        const belong:Record<number, ControlPoint[]|undefined> = {}
        for(let i=0; i<pts.length-1; i++){
            for(let j=i+1; j<pts.length; j++){
                const a = pts[i]
                const b = pts[j]
                if(clinging(a, b, true)){
                    const aBelong = belong[a.id]
                    const bBelong = belong[b.id]
                    if(aBelong && bBelong){
                        aBelong.push(...bBelong)
                        for(const pt of bBelong){
                            belong[pt.id] = aBelong
                        }
                        bBelong.length = 0
                    }else if(aBelong){
                        aBelong.push(b)
                        belong[b.id] = aBelong
                    }else if(bBelong){
                        bBelong.push(a)
                        belong[a.id] = bBelong
                    }else{
                        const newCrys = [a, b]
                        belong[a.id] = newCrys;
                        belong[b.id] = newCrys;
                        crys.push(newCrys)
                    }
                }
            }
        }
        const polys:Coord[][] = []
        crys.filter(c=>c.length>1).forEach(c=>{
            if(c[0].dir === ControlPointDir.vertical){
                let l = 1e10
                let r = -1e10
                let t = 1e10
                let b = -1e10
                for(let i=0; i<c.length; i++){
                    const [x,y] = c[i].pos
                    if(x < l)
                        l = x
                    if(x > r)
                        r = x
                    if(y < t)
                        t = y
                    if(y > b)
                        b = y
                }
                const poly:Coord[] = [[l,t], [r,t], [r,b], [l,b]]
                polys.push(poly)
            }else{
                let lt = 1e10
                let rb = -1e10
                let lb = 1e10
                let rt = -1e10
                for(let i=0; i<c.length; i++){
                    const [x,y] = c[i].pos
                    const sum = x+y;
                    const diff = x-y;
                    if(sum < lt)
                        lt = sum
                    if(sum > rb)
                        rb = sum
                    if(diff < lb)
                        lb = diff
                    if(diff > rt)
                        rt = diff
                }
                const t:Coord = [(lt+rt)/2, (lt-rt)/2]
                const l:Coord = [(lt+lb)/2, (lt-lb)/2]
                const r:Coord = [(rb+rt)/2, (rb-rt)/2]
                const b:Coord = [(rb+lb)/2, (rb-lb)/2]
                polys.push([t,l,b,r])
            }
        })
        return polys
    }

    const clingingDistWithEps = cs.config.snapOctaClingPtPtDist + numberCmpEpsilon
    const clingingDistSqWithEps = clingingDistWithEps ** 2
    function clinging(a:ControlPoint, b:ControlPoint, mustSameDir:boolean):boolean{
        if(!coordDistSqLessThan(a.pos, b.pos, clingingDistSqWithEps)){
            return false
        }
        if(mustSameDir && a.dir !== b.dir){
            return false
        }
        const xDiff = Math.abs(a.pos[0] - b.pos[0])
        const yDiff = Math.abs(a.pos[1] - b.pos[1])
        if(lessThanOrEqualTo(Math.abs(xDiff - yDiff), clingingDistWithEps)){
            return true
        }
        if(isZero(xDiff)){
            return lessThanOrEqualTo(yDiff, clingingDistWithEps)
        }
        else if(isZero(yDiff)){
            return lessThanOrEqualTo(xDiff, clingingDistWithEps)
        }
        return false;
    }

    return { renderClusters }
}