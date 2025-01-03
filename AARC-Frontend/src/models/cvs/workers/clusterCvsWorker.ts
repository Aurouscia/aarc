import { ControlPoint, ControlPointDir } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { Coord } from "@/models/coord";
import { useStaClusterStore } from "@/models/stores/saveDerived/staClusterStore";
import { defineStore } from "pinia";

export const useClusterCvsWorker = defineStore('clusterCvsWorker', ()=>{
    const staClusterStore = useStaClusterStore()
    const cs = useConfigStore()

    function renderClusters(ctx:CanvasRenderingContext2D){
        const crys = staClusterStore.getStaClusters()
        if(!crys)
            return;
        staClusterStore.setStaClusters([...crys])
        const polys = crystalsToPolys(crys)
        const forEachPoly = (doSth:()=>void)=>{
            for(const p of polys){
                ctx.beginPath();
                const firstPos = p[0]
                ctx.moveTo(firstPos[0], firstPos[1])
                for(let i=1;i<p.length;i++){
                    ctx.lineTo(p[i][0], p[i][1])
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
        ctx.lineWidth = rectLineWidth
        ctx.strokeStyle = bgColor
        forEachPoly(()=>{
            ctx.stroke()
        })
            
        ctx.lineWidth = rectLineWidth - cs.config.ptStaLineWidth
        ctx.strokeStyle = exchangeColor
        forEachPoly(() => {
            ctx.stroke()
        })
        ctx.lineWidth = rectLineWidth - cs.config.ptStaLineWidth*3
        ctx.strokeStyle = cs.config.ptStaFillColor
        ctx.fillStyle = cs.config.ptStaFillColor
        forEachPoly(() => {
            ctx.fill()
            ctx.stroke()
        })
    }

    function crystalsToPolys(crystals:ControlPoint[][]):Coord[][]{
        const polys:Coord[][] = []
        crystals.forEach(c=>{
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
    return { renderClusters }
})