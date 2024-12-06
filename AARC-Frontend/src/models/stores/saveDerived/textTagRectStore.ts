import { defineStore } from "pinia";
import { useKvStoreCore } from "./common/kvStoreCore";
import { RectCoord } from "@/models/coord";

export const useTextTagRectStore = defineStore('textTagRect', ()=>{
    const { setItem, enumerateItems } = useKvStoreCore<RectCoord>()
    return {
        setTextTagRect: setItem,
        enumerateTextTagRects: enumerateItems
    }
})