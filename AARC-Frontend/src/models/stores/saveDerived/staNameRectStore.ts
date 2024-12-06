import { RectCoord } from "@/models/coord";
import { defineStore } from "pinia";
import { useKvStoreCore } from "./common/kvStoreCore";

export const useStaNameRectStore = defineStore('staNameRect', ()=>{
    const { setItem, enumerateItems } = useKvStoreCore<RectCoord>()
    return { 
        setStaNameRects: setItem,
        enumerateStaNameRects: enumerateItems
    }
})