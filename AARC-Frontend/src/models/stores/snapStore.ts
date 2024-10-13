import { collapseWay, Coord, FormalRay, SgnCoord } from "@/models/coord";
import { useSaveStore } from "./saveStore";
import { ControlPoint, ControlPointDir } from "@/models/save";
import { snapGridThrs, snapInterPtsDist, snapNameThrs, snapThrs, sqrt2half,
    snapNameFromStaDist as snd, snapNameFromStaDistDiag as sndd} from "@/utils/consts";
import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { isZero, sgn } from "@/utils/sgn";
import { findIntersect } from "@/utils/rayIntersection";
import { applyBias } from "@/utils/coordBias";
import { coordDistSq, coordDistSqLessThan } from "@/utils/coordDist";

export const useSnapStore = defineStore('snap',()=>{
    const saveStore = useSaveStore()
    const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
    const snapLines = ref<FormalRay[]>([])
    const snapGridIntv = ref<number>()
    const snapStaNameTo:Coord[] = [
        [snd,0],[-snd,0],[0,snd],[0,-snd],
        [sndd,sndd],[sndd,-sndd],[-sndd,sndd],[-sndd,-sndd]
    ]
    function snap(pt:ControlPoint):Coord|undefined{
        snapLines.value = []
        const interPtRes = snapInterPt(pt)
        if(interPtRes){
            return interPtRes
        }
        const { snapRes:neibRes, freeAxis } = snapNeighborExtends(pt)
        if(neibRes && !freeAxis){
            return neibRes
        }
        const gridRes = snapGrid(neibRes || pt.pos, freeAxis)
        if(gridRes){
            return gridRes
        }
    }
    function snapName(pt:ControlPoint):{to:Coord,type:'vague'|'accu'}|undefined{
        if(!pt.nameP){
            return;
        }
        let [x, y] = pt.nameP
        const to = snapStaNameTo.find(t=>{
            return coordDistSqLessThan(pt.nameP!, t, snapNameThrs**2)
        })
        if(to){
            return {
                to:[...to] as Coord,
                type:'accu'
            }
        }

        let snaped = false;
        if(Math.abs(x) < snapNameThrs){
            x = 0
            snaped = true
        }
        if(Math.abs(y) < snapNameThrs){
            y = 0
            snaped = true
        }
        if(snaped)
            return {
                to: [x, y] as Coord,
                type: 'vague'
            }
    }
    function snapNeighborExtends(pt:ControlPoint):{snapRes?:Coord, freeAxis?:SgnCoord}{
        const pos = pt.pos
        const dir = pt.dir
        const neibs = saveStore.getNeighborByPt(pt.id)
        const cands:{dist:number, snapTo:Coord, source:ControlPoint}[] = []
        const tryCand = (dist:number, snapTo:Coord, source:ControlPoint)=>{
            if(cands.length<2)
            {
                if(cands.length==0 || cands[0].dist<dist){
                    cands.push({dist,snapTo,source})
                    return true;
                }else{
                    cands[1] = cands[0]
                    cands[0] = {dist,snapTo,source};
                    return true
                }
            }
            if(dist<cands[0].dist){
                cands[1] = cands[0]
                cands[0] = {dist,snapTo,source};
                return true
            }
            else if(dist<cands[1].dist){
                cands[1] = {dist,snapTo,source};
                return true
            }
            return false
        }
        neibs.forEach(n=>{
            const xDiff = n.pos[0] - pos[0]
            const yDiff = n.pos[1] - pos[1]
            if(xDiff**2 + yDiff**2 < snapThrs**2*2)
                return
            if(dir === ControlPointDir.vertical || n.dir === ControlPointDir.vertical){
                const xDiffAbs = Math.abs(xDiff)
                const yDiffAbs = Math.abs(yDiff)
                const dist = Math.min(xDiffAbs, yDiffAbs)
                if(dist<snapThrs){
                    let snapTo:Coord = [...pos];
                    if(tryCand(dist, snapTo, n)){
                        if(xDiffAbs < yDiffAbs){
                            snapTo[0] = n.pos[0]
                        }else{
                            snapTo[1] = n.pos[1]
                        }
                    }
                }
            }
            if(dir === ControlPointDir.incline || n.dir === ControlPointDir.incline){
                const diffdiff = xDiff*yDiff>0 ? (yDiff-xDiff) : (yDiff+xDiff)
                const dist = Math.abs(diffdiff) * sqrt2half
                if(dist<snapThrs){
                    let snapTo:Coord = [0,0];
                    if(tryCand(dist, snapTo, n)){
                        if(xDiff*yDiff>0){
                            snapTo[0] = pos[0]-diffdiff/2;
                            snapTo[1] = pos[1]+diffdiff/2
                        }
                        else{
                            snapTo[0] = pos[0]+diffdiff/2;
                            snapTo[1] = pos[1]+diffdiff/2
                        }
                    }
                }
            }
        })
        if(cands.length>0){
            cands.forEach(c=>{
                const xDiff = c.snapTo[0] - c.source.pos[0]
                const yDiff = c.snapTo[1] - c.source.pos[1] 
                snapLines.value.push({
                    source: c.source.pos,
                    way:[
                        sgn(xDiff),
                        sgn(yDiff)
                    ]
                })
            })
            const firstCandWay = snapLines.value[0].way
            if(cands.length == 1)
                return {snapRes:cands[0].snapTo, freeAxis:firstCandWay}
            else{
                const intersection = findIntersect(snapLines.value[0], snapLines.value[1], cands[0].snapTo)
                if(intersection)
                    return {snapRes: intersection}
                return {snapRes: cands[0].snapTo, freeAxis:firstCandWay}
            }
        }
        return {}
    }
    function snapInterPt(pt:ControlPoint):Coord|undefined{
        const pts = saveStore.getPtsInRange(pt.pos, snapInterPtsDist+snapThrs, pt.id)
        if(pts.length==0){
            return undefined
        }
        let target:Coord|undefined = undefined
        let minDistSq = 10000000;
        pts.forEach(opt=>{
            const biases:SgnCoord[] = []
            if(pt.dir == ControlPointDir.incline || opt.dir == ControlPointDir.incline){
                biases.push([-1,-1],[-1,1],[1,-1],[1,1])
            }
            if(pt.dir == ControlPointDir.vertical || opt.dir == ControlPointDir.vertical){
                biases.push([0,-1],[0,1],[1,0],[-1,0])
            }
            biases.forEach(b=>{
                const biased = applyBias(opt.pos, b, snapInterPtsDist)
                const distSq = coordDistSq(pt.pos, biased)
                if(distSq<snapThrs**2 && distSq<minDistSq){
                    target = biased;
                    minDistSq = distSq
                }
            })
        })
        return target
    }
    function snapGrid(ptPos:Coord, freeAxis?:SgnCoord):Coord|undefined{
        const intv = snapGridIntv.value
        if(!intv)
            return;
        let xDiff = 0;
        let yDiff = 0;
        const freeWay = collapseWay(freeAxis)
        if(freeWay !== 'vert'){
            let cursor = intv;
            while(cursor < cvsWidth.value){
                const xDiffHere = ptPos[0] - cursor
                const xDiffHereAbs = Math.abs(xDiffHere)
                if(xDiffHereAbs < snapGridThrs){
                    xDiff = xDiffHere
                    break;
                }
                cursor += intv
            }
        }
        if(freeWay !== 'hori'){
            let cursor = intv;
            while(cursor < cvsHeight.value){
                const yDiffHere = ptPos[1] - cursor
                const yDiffHereAbs = Math.abs(yDiffHere)
                if(yDiffHereAbs < snapGridThrs){
                    yDiff = yDiffHere
                    break
                }
                cursor += intv
            }
        }
        const pos = [...ptPos] as Coord
        let snapX = false
        let snapY = false
        if(freeWay === 'vert'){
            pos[1] -= yDiff;
            snapY = true
        }else if(freeWay === 'hori'){
            pos[0] -= xDiff;
            snapX = true
        }else if(freeWay === 'fall' || freeWay === 'rise'){
            let diff = 0;
            if(!isZero(xDiff)){
                if(isZero(yDiff)){
                    diff = xDiff
                    snapX = true
                }
                else{
                    const xDiffSmaller = Math.abs(xDiff) < Math.abs(yDiff)
                    if(xDiffSmaller){
                        diff = xDiff
                        snapX = true
                    }else{
                        diff = yDiff
                        snapY = true
                    }
                }
            }
            else if(!isZero(yDiff)){
                diff = yDiff
                snapY = true
            }
            if(freeWay === 'fall'){
                pos[0] -= diff;
                pos[1] -= diff;
            }else{
                if(snapY){
                    pos[0] += diff
                    pos[1] -= diff
                }else{
                    pos[0] -= diff
                    pos[1] += diff
                }
            }
        }else{
            pos[0] -= xDiff;
            pos[1] -= yDiff;
            snapX = !isZero(xDiff);
            snapY = !isZero(yDiff)
        }
        if(snapX){
            snapLines.value.push(
                {source:[...pos], way:[0, -1]},
                {source:[...pos], way:[0, 1]}
            )
        }
        if(snapY){
            snapLines.value.push(
                {source:[...pos], way:[1, 0]},
                {source:[...pos], way:[-1, 0]}
            )
        }
        return pos
    }
    return { snap, snapName, snapLines, snapGridIntv }
})