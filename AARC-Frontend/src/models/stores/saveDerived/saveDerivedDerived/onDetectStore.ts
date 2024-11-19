import { defineStore } from "pinia";
import { useSaveStore } from "../../saveStore";
import { Coord } from "@/models/coord";
import { coordDistSq } from "@/utils/coordUtils/coordDist";
import { ControlPoint, ControlPointDir } from "@/models/save";
import { useFormalizedLineStore } from "../formalizedLineStore";
import { useConfigStore } from "../../configStore";
import { coordOnLineOfFormalPts } from "@/utils/coordUtils/coordOnLine";
import { useStaNameRectStore } from "../staNameRectStore";
import { rectInside } from "@/utils/coordUtils/coordInsideRect";

export const useOnDetectStore = defineStore('onDetect', ()=>{
    const cs = useConfigStore()
    const saveStore = useSaveStore()
    const { enumerateFormalizedLines } = useFormalizedLineStore()
    const { enumerateStaNameRects } = useStaNameRectStore()
    function onPt(c:Coord){
        return saveStore.save?.points.find(p=>{
            const distSq = coordDistSq(p.pos, c)
            return distSq < cs.clickPtThrsSq
        })
    }
    function onLine(c:Coord, exceptLines:number[] = []){
        const res:{lineId:number, alignedPos:Coord, afterPtIdx:number, dir:ControlPointDir}[] = []
        enumerateFormalizedLines(line=>{
            if(exceptLines.includes(line.lineId))
                return;
            const onLineRes = coordOnLineOfFormalPts(c, line.pts, {
                clickLineThrs: cs.config.clickLineThrs,
                clickLineThrsSq: cs.clickLineThrsSq,
                clickLineThrs_sqrt2_sq: cs.clickLineThrs_sqrt2_sq
            })
            if(onLineRes){
                res.push({
                    lineId: line.lineId,
                    alignedPos: onLineRes.aligned,
                    afterPtIdx: onLineRes.afterPt,
                    dir: onLineRes.dir
                })
            }
        })
        return res
    }
    function onStaName(c:Coord){
        let onPt:ControlPoint|undefined;
        enumerateStaNameRects(rect=>{
            if(rectInside(rect.rect, c)){
                const pt = saveStore.save?.points.find(pt => pt.id == rect.ptId)
                onPt = pt;
                return;
            }
        })
        return onPt;
    }
    return { onPt, onLine, onStaName }
})