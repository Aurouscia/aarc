import { defineStore } from "pinia";
import { useKvStoreCore } from "./common/kvStoreCore";
import { RectCoord } from "@/models/coord";

export const useTextTagRectStore = defineStore('textTagRect', ()=>{
    const { setItem, enumerateItems, clearItems } = useKvStoreCore<RectCoord>()
    return {
        setTextTagRect: setItem,
        enumerateTextTagRects: enumerateItems,
        clearItems
    }
})