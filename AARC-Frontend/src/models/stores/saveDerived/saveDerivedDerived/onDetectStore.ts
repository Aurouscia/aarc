import { defineStore } from "pinia";
import { useSaveStore } from "../../saveStore";
import { Coord } from "@/models/coord";
import { coordDistSq, coordDistSqLessThan, coordDistSqWithThrs } from "@/utils/coordUtils/coordDist";
import { ControlPoint, ControlPointDir, TextTag } from "@/models/save";
import { useFormalizedLineStore } from "../formalizedLineStore";
import { useConfigStore } from "../../configStore";
import { coordOnLineOfFormalPts } from "@/utils/coordUtils/coordOnLine";
import { useStaNameRectStore } from "../staNameRectStore";
import { rectInside } from "@/utils/coordUtils/coordInsideRect";
import { ExtendBtn, useLineExtendStore } from "./lineExtendStore";
import { useTextTagRectStore } from "../textTagRectStore";

export const useOnDetectStore = defineStore('onDetect', ()=>{
    const cs = useConfigStore()
    const saveStore = useSaveStore()
    const { enumerateFormalizedLines } = useFormalizedLineStore()
    const { enumerateStaNameRects } = useStaNameRectStore()
    const { enumerateLineExtendBtns } = useLineExtendStore()
    const { enumerateTextTagRects } = useTextTagRectStore()
    function onPt(c:Coord, strictClosest?:boolean){
        if(saveStore.save?.points.length==0)
            return undefined
        if(!strictClosest){
            return saveStore.save?.points.find(p=>{
                const distSq = coordDistSq(p.pos, c)
                return distSq < cs.clickPtThrsSq
            })
        }
        let closestDistSq = 1e10
        let closestPt:ControlPoint|undefined = undefined
        saveStore.save?.points.map(p=>{
            const distSq = coordDistSqWithThrs(p.pos, c, cs.clickPtThrsSq)
            if(typeof distSq == 'number' && distSq < closestDistSq){
                closestDistSq = distSq
                closestPt = p
            }
        })
        if(closestDistSq < cs.clickPtThrsSq)
            return closestPt
    }
    function onLine(c:Coord, exceptLines:number[] = []){
        const res:{lineId:number, alignedPos:Coord, afterPtIdx:number, dir:ControlPointDir}[] = []
        enumerateFormalizedLines((lineId, formalPts)=>{
            if(exceptLines.includes(lineId))
                return;
            const onLineRes = coordOnLineOfFormalPts(c, formalPts, {
                clickLineThrs: cs.config.clickLineThrs,
                clickLineThrsSq: cs.clickLineThrsSq,
                clickLineThrs_sqrt2_sq: cs.clickLineThrs_sqrt2_sq
            })
            if(onLineRes){
                res.push({
                    lineId: lineId,
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
        enumerateStaNameRects((ptId, rect)=>{
            if(rectInside(rect, c)){
                const pt = saveStore.save?.points.find(pt => pt.id == ptId)
                onPt = pt;
                return true;
            }
        })
        return onPt;
    }
    function onLineExtendBtn(c:Coord){
        let onLeb:ExtendBtn|undefined
        enumerateLineExtendBtns(leb=>{
            if(coordDistSqLessThan(leb.btnPos, c, cs.clickPtThrsSq)){
                onLeb = leb
                return true
            }
        })
        return onLeb
    }
    function onTextTag(c:Coord){
        let onTextTag:TextTag|undefined;
        enumerateTextTagRects((id, rect)=>{
            if(rectInside(rect, c)){
                onTextTag = saveStore.save?.textTags.find(x=>x.id===id)
                return true;
            }
        })
        return onTextTag;
    }
    return { onPt, onLine, onStaName, onLineExtendBtn, onTextTag }
})