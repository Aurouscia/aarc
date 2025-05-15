import { defineStore } from "pinia";
import { FormalizedLine } from "../formalizedLineStore";
import { useSaveStore } from "../../saveStore";
import { coordTwinExtend } from "@/utils/coordUtils/coordMath";
import { Coord, SgnCoord, twinPts2SgnCoord } from "@/models/coord";
import { coordRelDir } from "@/utils/coordUtils/coordRel";
import { sqrt2 } from "@/utils/consts";
import { ControlPointDir } from "@/models/save";
import { useConfigStore } from "../../configStore";

export type ExtendBtn = {
    lineId:number, at:'head'|'tail', rootPos:Coord, lineWidthRatio:number,
    btnPos:Coord, btnDir:ControlPointDir, way:SgnCoord}
export const useLineExtendStore = defineStore('lineExtend', ()=>{
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    const extendBtnLengthVert = 150;
    const extendBtnLengthIncline = 100 * sqrt2
    const extendBtns:ExtendBtn[] = []
    function refreshLineExtend(ptId:number, relatedFormalizedSegs:FormalizedLine[]){
        clearLineExtendBtns()
        const targets:{lineId:number, at:'head'|'tail', lineWidthRatio:number}[] = []
        saveStore.save?.lines.forEach(line=>{
            if(line.pts.length<2)
                return
            const atHead = line.pts[0] == ptId
            const atTail = line.pts[line.pts.length-1] == ptId
            if(atHead && atTail)
                return
            let lineWidthRatioClamped = line.width??1
            if(lineWidthRatioClamped > 2)
                lineWidthRatioClamped = 2
            if(atHead)
                targets.push({lineId:line.id, at:'head', lineWidthRatio:lineWidthRatioClamped})
            else if(atTail)
                targets.push({lineId:line.id, at:'tail', lineWidthRatio:lineWidthRatioClamped})
        })
        relatedFormalizedSegs.forEach(fl=>{
            const tar = targets.find(x=>fl.lineId==x.lineId)
            if(tar && fl.pts.length>=2){
                let rootPos:Coord
                let secondPos:Coord
                if(tar.at=='head'){
                    rootPos = fl.pts[0].pos
                    secondPos = fl.pts[1].pos
                }else{
                    const m = fl.pts.length-1;
                    rootPos = fl.pts[m].pos
                    secondPos = fl.pts[m-1].pos
                }
                const lineWidthRatio = tar.lineWidthRatio
                const btnDir = coordRelDir(rootPos, secondPos)
                const handleLength = getHandleLength(btnDir, lineWidthRatio)
                const btnPos = coordTwinExtend(rootPos, secondPos, handleLength)
                const way = twinPts2SgnCoord(secondPos, rootPos)
                extendBtns.push({...tar, rootPos, btnPos, btnDir, way, lineWidthRatio})
            }
        })
    }
    function enumerateLineExtendBtns(fn:(ex:ExtendBtn)=>boolean|undefined|void){
        for(let line of extendBtns){
            const enough = fn(line)
            if(enough)
                break
        }
    }
    function getLineExtendWays():SgnCoord[]{
        return extendBtns.map(x=>[...x.way])
    }
    function removeLineExtendBtn(lineExtend:ExtendBtn){
        const idx = extendBtns.indexOf(lineExtend)
        if(idx >= 0)
            extendBtns.splice(idx, 1)
    }
    function clearLineExtendBtns(){
        extendBtns.splice(0, extendBtns.length)
    }
    function getHandleLength(type:ControlPointDir, lineWidthRatio:number){
        const defaultVal = (type === ControlPointDir.vertical
            ? extendBtnLengthVert
            : extendBtnLengthIncline) * lineWidthRatio
        const configVal = type === ControlPointDir.vertical
            ? cs.config.lineExtensionHandleLengthVert
            : cs.config.lineExtensionHandleLengthInc
        if(!configVal)
            return defaultVal
        if(configVal.startsWith("*")){
            let factor = parseFloat(configVal.slice(1))
            if(isNaN(factor))
                factor = 1
            return defaultVal * factor
        }else{
            let val = parseFloat(configVal)
            if(isNaN(val))
                val = defaultVal
            return val
        }
    }
    return {
        refreshLineExtend, enumerateLineExtendBtns, getLineExtendWays, removeLineExtendBtn, clearLineExtendBtns, 
        clearItems:clearLineExtendBtns }
})