import { defineStore } from "pinia";
import { useFormalizedLineStore } from "../formalizedLineStore";
import { useSaveStore } from "../../saveStore";
import { coordTwinExtend } from "@/utils/coordUtils/coordMath";
import { Coord } from "@/models/coord";

export const useLineExtendStore = defineStore('lineExtend', ()=>{
    const { enumerateFormalizedLines } = useFormalizedLineStore()
    const saveStore = useSaveStore()
    type ExtendBtn = {lineId:number, at:'head'|'tail', rootPos:Coord, btnPos:Coord}
    const extendBtnLength = 200;
    const extendBtns:ExtendBtn[] = []
    function refreshLineExtend(ptId:number){
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
        enumerateFormalizedLines(fl=>{
            const tar = targets.find(x=>fl.lineId==x.lineId)
            if(tar && fl.pts.length>=2){
                let rootPos:Coord
                let btnPos:Coord
                if(tar.at=='head'){
                    rootPos = fl.pts[0].pos
                    const secondPos = fl.pts[1].pos
                    btnPos = coordTwinExtend(rootPos, secondPos, extendBtnLength)
                }else{
                    const m = fl.pts.length-1;
                    rootPos = fl.pts[m].pos
                    const secondPos = fl.pts[m-1].pos
                    btnPos = coordTwinExtend(rootPos, secondPos, extendBtnLength)
                }
                extendBtns.push({...tar, rootPos, btnPos})
            }
        })
    }
    function enumerateLineExtendBtns(fn:(ex:ExtendBtn)=>void){
        extendBtns.forEach(fn)
    }
    return { refreshLineExtend, enumerateLineExtendBtns }
})