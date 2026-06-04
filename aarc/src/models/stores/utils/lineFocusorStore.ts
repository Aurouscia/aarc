import { Line, LineType } from "@/models/save";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useLineFocusorStore = defineStore('linefocusor', ()=>{
    const focusCommonLine = ref<(lineId?:number)=>void>(()=>{})
    const focusTerrainLine = ref<(lineId?:number)=>void>(()=>{})
    function focusLine(line?:Line){
        if(line?.type === LineType.common)
            focusCommonLine.value(line.id)
        else if(line?.type === LineType.terrain)
            focusTerrainLine.value(line.id)
    }
    return {
        focusLine,
        focusCommonLine,
        focusTerrainLine
    }
})
