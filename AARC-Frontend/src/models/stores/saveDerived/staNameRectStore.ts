import { RectCoord } from "@/models/coord";
import { defineStore } from "pinia";

export interface StaNameRect{
    ptId:number,
    rect:RectCoord
}

export const useStaNameRectStore = defineStore('staNameRect', ()=>{
    const staNameRects:StaNameRect[] = []
    function setStaNameRects(ptId:number, rect:RectCoord|false){
        let targetIdx = staNameRects.findIndex(x=>x.ptId == ptId)
        let target = staNameRects[targetIdx]
        if(rect){
            if(!target){
                target = {ptId, rect}
                staNameRects.push(target)
            }
            else{
                target.rect = rect
            }
        }else{
            if(target){
                staNameRects.splice(targetIdx, 1)
            }
        }
    }
    function enumerateStaNameRects(fn:(rect:StaNameRect)=>void){
        staNameRects.forEach(fn)
    }
    return { setStaNameRects, enumerateStaNameRects }
})