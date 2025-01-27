import { collapseWay, Coord, FormalRay, SgnCoord } from "@/models/coord";
import { useSaveStore } from "./saveStore";
import { ControlPoint, ControlPointDir } from "@/models/save";
import { defineStore, storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { isZero, sgn } from "@/utils/sgn";
import { rayIntersect } from "@/utils/rayUtils/rayIntersection";
import { applyBias } from "@/utils/coordUtils/coordBias";
import { coordDistSq, coordDistSqLessThan } from "@/utils/coordUtils/coordDist";
import { useConfigStore } from "./configStore";
import { numberCmpEpsilon, sqrt2half } from "@/utils/consts";

export const useSnapStore = defineStore('snap',()=>{
    const cs = useConfigStore()
    const saveStore = useSaveStore()
    const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
    const snapLines = ref<FormalRay[]>([])
    const snapLinesForPt = ref<number>()
    const snapGridIntv = ref<number>()
    const snappingNamePtId = ref<number>()
    const snapStaNameTo = computed<Coord[]>(()=>{
        const ptId = snappingNamePtId.value || -1
        const distRatio = saveStore.getLinesDecidedPtSize(ptId)
        const snd = cs.config.snapOctaClingPtNameDist * distRatio;
        const sndh = snd * sqrt2half;
        return [
            [snd,0],[-snd,0],[0,snd],[0,-snd],
            [sndh,sndh],[sndh,-sndh],[-sndh,sndh],[-sndh,-sndh]
        ]
    })
    const snapNeighborExtendsOnlySameDir = ref<boolean>(false)
    function snap(pt:ControlPoint):Coord|undefined{
        snapLines.value = []
        snapLinesForPt.value = pt.id
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
        snappingNamePtId.value = pt.id
        const snapClingThrsSq = cs.snapOctaClingPtNameThrsSq
        const snapRayThrs = cs.config.snapOctaRayPtNameThrs
        let [x, y] = pt.nameP
        const to = snapStaNameTo.value.find(t=>{
            return coordDistSqLessThan(pt.nameP!, t, snapClingThrsSq)
        })
        if(to){
            return {
                to:[...to] as Coord,
                type:'accu'
            }
        }

        let snaped = false;
        if(Math.abs(x) < snapRayThrs){
            x = 0
            snaped = true
        }
        if(Math.abs(y) < snapRayThrs){
            y = 0
            snaped = true
        }
        if(snaped)
            return {
                to: [x, y] as Coord,
                type: 'vague'
            }
    }
    function snapNameStatus(pt:ControlPoint):{type:'vague'|'accu'}|undefined{
        if(!pt.nameP)
            return;
        let [x, y] = pt.nameP
        const epsSqr = numberCmpEpsilon ** 2
        const to = snapStaNameTo.value.find(t=>{
            return coordDistSqLessThan(pt.nameP!, t, epsSqr)
        })
        if(to){
            return {type:'accu'}
        }
        if(Math.abs(x) < numberCmpEpsilon || Math.abs(y) < numberCmpEpsilon)
            return {type: 'vague'}
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
            if(snapNeighborExtendsOnlySameDir.value && dir !== n.dir)
                return
            const xDiff = n.pos[0] - pos[0]
            const yDiff = n.pos[1] - pos[1]
            if(dir === ControlPointDir.vertical || n.dir === ControlPointDir.vertical){
                const xDiffAbs = Math.abs(xDiff)
                const yDiffAbs = Math.abs(yDiff)
                const dist = Math.min(xDiffAbs, yDiffAbs)
                if(dist<cs.config.snapOctaRayPtPtThrs){
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
                if(dist<cs.config.snapOctaRayPtPtThrs){
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
            if(cands.length > 1){
                const intersection = rayIntersect(snapLines.value[0], snapLines.value[1])
                if(intersection)
                    return {snapRes: intersection}
            }
            return {snapRes: cands[0].snapTo, freeAxis:firstCandWay}
        }
        return {}
    }
    function snapInterPt(pt:ControlPoint):Coord|undefined{
        const snapDist = cs.config.snapOctaClingPtPtDist;
        const snapThrs = cs.config.snapOctaClingPtPtThrs;
        const snapThrsSq = cs.snapOctaClingPtPtThrsSq
        const pts = saveStore.getPtsInRange(pt.pos, snapDist + snapThrs, pt.id)
        if(pts.length==0){
            return undefined
        }
        let target:Coord|undefined = undefined
        let minDistSq = 10000000;
        pts.forEach(opt=>{
            const biases:SgnCoord[] = [[0,0]]
            if(pt.dir == ControlPointDir.incline || opt.dir == ControlPointDir.incline){
                biases.push([-1,-1],[-1,1],[1,-1],[1,1])
            }
            if(pt.dir == ControlPointDir.vertical || opt.dir == ControlPointDir.vertical){
                biases.push([0,-1],[0,1],[1,0],[-1,0])
            }
            biases.forEach(b=>{
                const biased = applyBias(opt.pos, b, snapDist)
                const distSq = coordDistSq(pt.pos, biased)
                if(distSq<snapThrsSq && distSq<minDistSq){
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
        let xDiff = 0;//与足够近的竖线（如果有）的x之差
        let yDiff = 0;//与足够近的横线（如果有）的y之差
        let xMatched = false;//是否距离竖线足够近
        let yMatched = false;//是否距离横线足够近
        const freeWay = collapseWay(freeAxis)

        //寻找是否有足够近的竖线，如果自由度只有上下就不找
        if(freeWay !== 'vert'){
            let cursor = intv;
            while(cursor < cvsWidth.value){
                const xDiffHere = ptPos[0] - cursor
                const xDiffHereAbs = Math.abs(xDiffHere)
                if(xDiffHereAbs < cs.config.snapGridThrs){
                    xDiff = xDiffHere
                    xMatched = true
                    break;
                }
                cursor += intv
            }
        }
        //寻找是否有足够近的横线，如果自由度只有左右就不找
        if(freeWay !== 'hori'){
            let cursor = intv;
            while(cursor < cvsHeight.value){
                const yDiffHere = ptPos[1] - cursor
                const yDiffHereAbs = Math.abs(yDiffHere)
                if(yDiffHereAbs < cs.config.snapGridThrs){
                    yDiff = yDiffHere
                    yMatched = true
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
            snapY = yMatched
        }else if(freeWay === 'hori'){
            pos[0] -= xDiff;
            snapX = xMatched
        }else if(freeWay === 'fall' || freeWay === 'rise'){
            let diff = 0;
            if(xMatched){
                if(!yMatched){
                    //有足够近竖线，但没有足够近横线
                    diff = xDiff
                    snapX = true
                }
                else{
                    //横竖都有足够近的
                    const diffSame = freeWay === 'fall' ? (isZero(xDiff - yDiff)):(isZero(xDiff + yDiff))
                    if(diffSame){
                        //正好横、竖、延长线都能匹配
                        snapX = true
                        snapY = true
                        diff = yDiff
                    }else{
                        //没有那么巧
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
            }
            else if(yMatched){
                //有足够近横线，但没有足够近竖线
                diff = yDiff
                snapY = true
            }
            //都没有（什么都不做）

            //应用坐标差，修正位置
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
            snapX = xMatched
            snapY = yMatched
        }
        //画吸附线
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
    return {
        snap, snapName, snapNameStatus, snapGrid,
        snapLines, snapLinesForPt, snapGridIntv, snapNeighborExtendsOnlySameDir
    }
})