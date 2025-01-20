import { Coord, FormalPt } from "@/models/coord";
import { defineStore } from "pinia";
import { useKvStoreCore } from "./common/kvStoreCore";

export interface FormalizedLine{
    lineId:number,
    pts:FormalPt[]
}

export const useFormalizedLineStore = defineStore('formalizedLine', ()=>{
    const { getItem, setItem, enumerateItems, clearItems } = useKvStoreCore<FormalPt[]>()

    function findAdjacentFormatPts(ptIdx:number, lineId:number){
        const linePts = getItem(lineId)
        if(!linePts)
            return []
        const idx = linePts.findIndex(x=>x.afterIdxEqv==ptIdx)
        if(idx===-1)
            return []
        const res:Coord[] = []
        if(idx>0){
            res.push(linePts[idx-1].pos)
        }
        if(idx<linePts.length-1){
            res.push(linePts[idx+1].pos)
        }
        return res
    }
    return { 
        setLinesFormalPts: setItem,
        enumerateFormalizedLines: enumerateItems,
        findAdjacentFormatPts,
        clearItems
    }
})