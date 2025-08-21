import { Line, LineType } from "@/models/save";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useOptionsOpenerStore = defineStore('optionsopener', ()=>{
    const openOptionsForCommonLine = ref<(lineId?:number)=>void>(()=>{})
    const openOptionsForTerrainLine = ref<(lineId?:number)=>void>(()=>{})
    function openOptionsFor(line?:Line){
        if(line?.type === LineType.common)
            openOptionsForCommonLine.value(line.id)
        else if(line?.type === LineType.terrain)
            openOptionsForTerrainLine.value(line.id)
    }
    return {
        openOptionsFor,
        openOptionsForCommonLine,
        openOptionsForTerrainLine
    }
})