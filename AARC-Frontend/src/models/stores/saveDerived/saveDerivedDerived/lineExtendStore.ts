import { defineStore } from "pinia";
import { FormalizedLine } from "../formalizedLineStore";
import { useSaveStore } from "../../saveStore";
import { coordTwinExtend } from "@/utils/coordUtils/coordMath";
import { Coord } from "@/models/coord";
import { coordRelDir } from "@/utils/coordUtils/coordRel";
import { sqrt2 } from "@/utils/consts";
import { ControlPointDir } from "@/models/save";

export type ExtendBtn = {lineId:number, at:'head'|'tail', rootPos:Coord, btnPos:Coord, btnDir:ControlPointDir}
export const useLineExtendStore = defineStore('lineExtend', ()=>{
    const saveStore = useSaveStore()
    const extendBtnLengthVert = 150;
    const extendBtnLengthIncline = 100 * sqrt2
    const extendBtns:ExtendBtn[] = []
    function refreshLineExtend(ptId:number, relatedFormalizedSegs:FormalizedLine[]){
        extendBtns.length = 0
        const targets:{lineId:number, at:'head'|'tail'}[] = []
        saveStore.save?.lines.forEach(line=>{
            if(line.pts.length<2)
                return
            const atHead = line.pts[0] == ptId
            const atTail = line.pts[line.pts.length-1] == ptId
            if(atHead && atTail)
                return
            if(atHead)
                targets.push({lineId:line.id, at:'head'})
            else if(atTail)
                targets.push({lineId:line.id, at:'tail'})
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
                const btnPos = coordTwinExtend(rootPos, secondPos, eLength)
                extendBtns.push({...tar, rootPos, btnPos, btnDir})
            }
        })
    }
    function enumerateLineExtendBtns(fn:(ex:ExtendBtn)=>void){
        extendBtns.forEach(fn)
    }
    return { refreshLineExtend, enumerateLineExtendBtns }
})