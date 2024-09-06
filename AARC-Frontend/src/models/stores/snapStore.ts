import { Coord } from "@/models/coord";
import { useSaveStore } from "./saveStore";
import { ControlPoint, ControlPointDir } from "@/models/save";
import { snapThrs, sqrt2half } from "@/utils/consts";
import { defineStore } from "pinia";
import { ref } from "vue";
import { sgn } from "@/utils/sgn";

export const useSnapStore = defineStore('snap',()=>{
    const saveStore = useSaveStore()
    const snapLine = ref<{from:Coord, way:Coord}>()
    function snap(pt:ControlPoint){
        const pos = pt.pos
        const dir = pt.dir
        const neibs = saveStore.getNeighborByPt(pt.id)
        let minDist = 10000000;
        let target:Coord|undefined = undefined;
        let from = pos;
        neibs.forEach(n=>{
            const xDiff = n.pos[0] - pos[0]
            const yDiff = n.pos[1] - pos[1]
            if(dir === ControlPointDir.vertical || n.dir === ControlPointDir.vertical){
                const xDiffAbs = Math.abs(xDiff)
                const yDiffAbs = Math.abs(yDiff)
                const dist = Math.min(xDiffAbs, yDiffAbs)
                if(dist<minDist){
                    minDist = dist;
                    from = n.pos
                    if(xDiffAbs < yDiffAbs){
                        target = [n.pos[0], pos[1]]
                    }else{
                        target = [pos[0], n.pos[1]]
                    }
                }
            }
            if(dir === ControlPointDir.incline || n.dir === ControlPointDir.incline){
                const diffdiff = xDiff*yDiff>0 ? (yDiff-xDiff) : (yDiff+xDiff)
                const dist = Math.abs(diffdiff) * sqrt2half
                if(dist<minDist){
                    minDist = dist
                    from = n.pos
                    if(xDiff*yDiff>0)
                        target = [pos[0]-diffdiff/2, pos[1]+diffdiff/2]
                    else
                        target = [pos[0]+diffdiff/2, pos[1]+diffdiff/2]
                }
            }
        })
        if(minDist < snapThrs && target){
            const xDiff = target[0] - from[0]
            const yDiff = target[1] - from[1] 
            snapLine.value = {
                from,
                way:[
                    sgn(xDiff),
                    sgn(yDiff)
                ]
            }
            return target
        }
        snapLine.value = undefined
    }
    return { snap, snapLine }
})