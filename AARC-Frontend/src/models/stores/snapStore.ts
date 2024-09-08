import { Coord, FormalRay, SgnCoord } from "@/models/coord";
import { useSaveStore } from "./saveStore";
import { ControlPoint, ControlPointDir } from "@/models/save";
import { snapInterPtsDist, snapThrs, sqrt2half } from "@/utils/consts";
import { defineStore } from "pinia";
import { ref } from "vue";
import { isSameCoord, sgn } from "@/utils/sgn";
import { findIntersect } from "@/utils/rayIntersection";
import { applyBias } from "@/utils/coordBias";
import { coordDistSq } from "@/utils/coordDist";

export const useSnapStore = defineStore('snap',()=>{
    const saveStore = useSaveStore()
    const snapLines = ref<FormalRay[]>([])
    function snap(pt:ControlPoint){
        snapLines.value = []
        const interPtRes = snapInterPt(pt)
        if(interPtRes){
            return interPtRes
        }
        const neibRes = snapNeighborExtends(pt)
        if(neibRes){
            return neibRes
        }
    }
    function snapNeighborExtends(pt:ControlPoint){
        const pos = pt.pos
        const dir = pt.dir
        const neibs = saveStore.getNeighborByPt(pt.id)
        const cands:{dist:number, snapTo:Coord, source:Coord}[] = []
        const tryCand = (dist:number, snapTo:Coord, source:Coord)=>{
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
                    if(tryCand(dist, snapTo, n.pos)){
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
                    if(tryCand(dist, snapTo, n.pos)){
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
                const xDiff = c.snapTo[0] - c.source[0]
                const yDiff = c.snapTo[1] - c.source[1] 
                snapLines.value.push({
                    source: c.source,
                    way:[
                        sgn(xDiff),
                        sgn(yDiff)
                    ]
                })
            })
            if(cands.length == 1)
                return cands[0].snapTo
            else{
                const intersection = findIntersect(snapLines.value[0], snapLines.value[1], cands[0].snapTo)
                if(intersection)
                    return intersection
                return cands[0].snapTo
            }
        }
    }
    function snapInterPt(pt:ControlPoint){
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
    return { snap, snapLines }
})