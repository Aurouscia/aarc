import { RectCoord } from "@/models/coord";
import { defineStore } from "pinia";
import { useKvStoreCore } from "./common/kvStoreCore";

export const useStaNameRectStore = defineStore('staNameRect', ()=>{
    const { getItem, setItem, enumerateItems, clearItems } = useKvStoreCore<RectCoord>()
    function setStaNameRect(key:number, value:RectCoord|undefined){
        setItem(key, value)
        if(value === undefined){
            useStaNameMainRectStore().setStaNameMainRect(key, undefined)
        }
    }
    return { 
        getStaNameRect: getItem,
        setStaNameRect,
        enumerateStaNameRects: enumerateItems,
        clearItems
    }
})

export const useStaNameMainRectStore = defineStore('staNameMainRect', ()=>{
    const { getItem, setItem, enumerateItems, clearItems } = useKvStoreCore<RectCoord>()
    return { 
        getStaNameMainRect: getItem,
        setStaNameMainRect: setItem,
        enumerateStaNameMainRects: enumerateItems,
        clearItems
    }
})