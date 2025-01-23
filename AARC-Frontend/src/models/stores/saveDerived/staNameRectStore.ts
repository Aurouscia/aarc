import { RectCoord } from "@/models/coord";
import { defineStore } from "pinia";
import { useKvStoreCore } from "./common/kvStoreCore";

export const useStaNameRectStore = defineStore('staNameRect', ()=>{
    const { getItem, setItem, enumerateItems, clearItems } = useKvStoreCore<RectCoord>()
    return { 
        getStaNameRect: getItem,
        setStaNameRects: setItem,
        enumerateStaNameRects: enumerateItems,
        clearItems
    }
})