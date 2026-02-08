import { Coord, FormalPt } from "@/models/coord";
import { defineStore } from "pinia";
import { useKvStoreCore } from "./common/kvStoreCore";

export interface FormalizedLine{
    lineId:number,
    pts:FormalPt[]
}

export const useFormalizedLineStore = defineStore('formalizedLine', ()=>{
    const { getItem, setItem, enumerateItems, clearItems } = useKvStoreCore<FormalPt[]>()

    /** formalizedLines“选中点拖动时”的局部值（activeCvs画布中算出的，正经值可能还没更新）该值仅对activePt有效 */
    let localFormalSegs:FormalizedLine[]|null = null
    
    /** 设置formalizedLines“正经值” */
    function setLinesFormalPts(lineId: number, formalPts:FormalPt[]|undefined){
        // 设置“正经值”时，清空局部值
        localFormalSegs = null
        setItem(lineId, formalPts)
    }

    // TODO: 无法处理自交点，考虑另外加一个以站点id为参数的
    function findAdjacentFormalPts(ptIdx:number, lineId:number){
        let pts:FormalPt[]|null = null
        // 先在“局部”里找
        if(localFormalSegs){
            const seg = localFormalSegs.find(x=>x.lineId==lineId)
            if(seg){
                pts = seg.pts
            }
        }
        // 再在KvStore里找
        if(!pts){
            const linePts = getItem(lineId)
            if(linePts)
                pts = linePts 
        }
        if(!pts || pts.length == 0)
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
        setLinesFormalPts,
        enumerateFormalizedLines: enumerateItems,
        findAdjacentFormalPts,
        clearItems,
        setLocalFormalSegs
    }
})