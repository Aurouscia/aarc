import { Coord, FormalPt } from "@/models/coord";
import { defineStore } from "pinia";
import { useKvStoreCore } from "./common/kvStoreCore";

export interface FormalizedLine{
    lineId:number,
    pts:FormalPt[]
}

export const useFormalizedLineStore = defineStore('formalizedLine', ()=>{
    const { getItem, setItem, enumerateItems, clearItems } = useKvStoreCore<FormalPt[]>()
    let localFormalSegs:FormalizedLine[] = []

    // TODO: 无法处理自交点，考虑另外加一个以站点id为参数的
    function findAdjacentFormalPts(ptIdx:number, lineId:number){
        let pts:FormalPt[] = []
        // 先在“局部”里找（activeCvs画布中算出的，可能还没有更新）
        if(localFormalSegs.length>0){
            const seg = localFormalSegs.find(x=>x.lineId==lineId)
            if(seg){
                pts = seg.pts
            }
        }
        // 再在KvStore里找
        else{
            const linePts = getItem(lineId)
            if(linePts)
                pts = linePts 
        }
        if(pts.length == 0)
            return []
        const idx = pts.findIndex(x=>x.afterIdxEqv==ptIdx)
        if(idx===-1)
            return []
        const res:Coord[] = []
        if(idx>0){
            res.push(pts[idx-1].pos)
        }
        if(idx<pts.length-1){
            res.push(pts[idx+1].pos)
        }
        return res
    }

    function setLocalFormalSegs(segs:FormalizedLine[]){
        localFormalSegs = segs
    }

    return { 
        setLinesFormalPts: setItem,
        enumerateFormalizedLines: enumerateItems,
        findAdjacentFormalPts,
        clearItems,
        setLocalFormalSegs
    }
})