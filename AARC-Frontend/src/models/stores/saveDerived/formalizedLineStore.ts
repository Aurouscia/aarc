import { FormalPt } from "@/models/coord";
import { defineStore } from "pinia";

export interface FormalizedLine{
    lineId:number,
    pts:FormalPt[]
}

export const useFormalizedLineStore = defineStore('formalizedLine', ()=>{
    const formalizedLines:FormalizedLine[] = []
    function setLinesFormalPts(lineId:number, pts:FormalPt[]|false){
        if(pts===false){
            let idx = formalizedLines.findIndex(x=>x.lineId == lineId)
            formalizedLines.splice(idx, 1)
            return
        }
        let target = formalizedLines.find(x=>x.lineId == lineId)
        if(!target){
            target = {lineId, pts}
            formalizedLines.push(target)
        }
        else{
            target.pts = pts
        }
    }
    function enumerateFormalizedLines(fn:(line:FormalizedLine)=>void){
        formalizedLines.forEach(fn)
    }
    return { 
        setLinesFormalPts,
        enumerateFormalizedLines
    }
})