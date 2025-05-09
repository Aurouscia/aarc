import { defineStore } from "pinia";
import { FormalizedLine } from "../formalizedLineStore";
import { useSaveStore } from "../../saveStore";
import { coordTwinExtend } from "@/utils/coordUtils/coordMath";
import { Coord, SgnCoord, twinPts2SgnCoord } from "@/models/coord";
import { coordRelDir } from "@/utils/coordUtils/coordRel";
import { sqrt2 } from "@/utils/consts";
import { ControlPointDir } from "@/models/save";

export type ExtendBtn = {
    lineId:number, at:'head'|'tail', rootPos:Coord, lineWidthRatio:number,
    btnPos:Coord, btnDir:ControlPointDir, way:SgnCoord}
export const useLineExtendStore = defineStore('lineExtend', ()=>{
    const saveStore = useSaveStore()
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
            if(atHead)
                targets.push({lineId:line.id, at:'head', lineWidthRatio:line.width??1})
            else if(atTail)
                targets.push({lineId:line.id, at:'tail', lineWidthRatio:line.width??1})
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
                let eLength = extendBtnLengthVert
                
                const btnDir = coordRelDir(rootPos, secondPos)
                if(btnDir === ControlPointDir.incline){
                    eLength = extendBtnLengthIncline
                }
                const lineWidthRatio = tar.lineWidthRatio
                eLength *= lineWidthRatio
                const btnPos = coordTwinExtend(rootPos, secondPos, eLength)
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
    return {
        refreshLineExtend, enumerateLineExtendBtns, getLineExtendWays, removeLineExtendBtn, clearLineExtendBtns, 
        clearItems:clearLineExtendBtns }
})