import { Coord, FormalPt } from "@/models/coord";
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
    function findAdjacentFormatPts(ptIdx:number, lineId:number){
        const line = formalizedLines.find(x=>x.lineId==lineId)
        if(!line)
            return []
        const idx = line?.pts.findIndex(x=>x.afterIdxEqv==ptIdx)
        if(idx===-1)
            return []
        const res:Coord[] = []
        if(idx>0){
            res.push(line.pts[idx-1].pos)
        }
        if(idx<line.pts.length-1){
            res.push(line.pts[idx+1].pos)
        }
        return res
    }
    function enumerateFormalizedLines(fn:(line:FormalizedLine)=>void){
        formalizedLines.forEach(fn)
    }
    return { 
        setLinesFormalPts,
        enumerateFormalizedLines,
        findAdjacentFormatPts
    }
})