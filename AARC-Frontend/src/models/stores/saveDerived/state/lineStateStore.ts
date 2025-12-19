import { defineStore, storeToRefs } from "pinia";
import { computed } from "vue";
import { useSaveStore } from "../../saveStore";
import { useConfigStore } from "../../configStore";
import { Line } from "@/models/save";
import { useRenderOptionsStore } from "../../renderOptionsStore";
import { useColorProcStore } from "../../utils/colorProcStore";

export const useLineStateStore = defineStore('lineState', () => {
    const saveStore = useSaveStore()
    const { save } = storeToRefs(saveStore)
    const { accentuationLineIds, accentuationEnabled, accentuationConfig } = storeToRefs(useRenderOptionsStore())
    const configStore = useConfigStore()
    const colorProc = useColorProcStore()

    const lineActualColors = computed<Map<number, {color:string, downplayed?:boolean}>>(() => {
        const res: Map<number, {color:string, downplayed?:boolean}> = new Map()
        if (!save.value?.lines)
            return res

        // 初步算出线路的“实际颜色”
        for (const line of save.value.lines) {
            let actualColor = line.color
            if (line.colorPre) {
                actualColor = configStore.getPresetColor(line.colorPre)
            }
            res.set(line.id, {color: actualColor})
        }
        
        // 根据“强调”设置，对该黑白化的线路进行黑白化
        if(accentuationEnabled.value){
            const acc = accentuationConfig.value
            const accIds = accentuationLineIds.value
            let accentuatedColors:Set<string>|undefined
            if(acc.spread){
                accentuatedColors = new Set()
                for (const [lineId, {color}] of res.entries()){
                    if(accIds.includes(lineId) && color){
                        accentuatedColors.add(color)
                    }
                }
            }
            for (const [lineId, {color}] of res.entries()){
                if(!color) continue
                const isTerrain = saveStore.getLineById(lineId)?.type
                const inAccIds = accIds.includes(lineId)
                const accBySpread = accentuatedColors?.has(color)
                const accByTerrain = acc.terrain && isTerrain
                const downplay = !inAccIds && !accBySpread && !accByTerrain
                if(downplay){
                    const newColor = colorProc.colorProcDownplay.convert(color)
                    res.set(lineId, {color:newColor, downplayed:true})
                }
            }
        }
        return res
    })
    function getLineActualColor(line:Line) {
        return lineActualColors.value.get(line.id)?.color || line.color
    }
    function getLineActualColorById(lineId:number){
        return lineActualColors.value.get(lineId)?.color
    }
    function isLineDownplayed(lineId:number){
        return lineActualColors.value.get(lineId)?.downplayed
    }
    return {
        getLineActualColor,
        getLineActualColorById,
        isLineDownplayed
    }
})