import { defineStore, storeToRefs } from "pinia";
import { computed } from "vue";
import { useSaveStore } from "../../saveStore";
import { useConfigStore } from "../../configStore";
import { Line, LineTimeInfo } from "@/models/save";
import { useRenderOptionsStore } from "../../renderOptionsStore";
import { useColorProcStore } from "../../utils/colorProcStore";

export const useLineStateStore = defineStore('lineState', () => {
    const saveStore = useSaveStore()
    const { save } = storeToRefs(saveStore)
    const { 
        accentuationLineIds, accentuationEnabled, accentuationConfig,
        timeMoment, timeConfig,
        exporting 
    } = storeToRefs(useRenderOptionsStore())
    const configStore = useConfigStore()
    const colorProc = useColorProcStore()

    const lineActualColors = computed<Map<number, {color:string, downplayed?:boolean}>>(() => {
        const res: Map<number, {
            color: string
            time?: LineTimeInfo,
            downplayed?: boolean
        }> = new Map()
        if (!save.value?.lines)
            return res

        // 初步算出线路的“实际颜色”
        for (const line of save.value.lines) {
            let actualColor = line.color
            if (line.colorPre) {
                actualColor = configStore.getPresetColor(line.colorPre)
            }
            res.set(line.id, {color: actualColor, time: {...line.time}})
        }
        
        // 根据“强调”设置，对该黑白化的线路进行黑白化
        const runDownplayByAcc = 
            accentuationEnabled.value 
            && accentuationLineIds.value.length>0 
            && (exporting.value || accentuationConfig.value.enabledPreview)
        if(runDownplayByAcc){
            const acc = accentuationConfig.value
            const accIds = accentuationLineIds.value
            let accentuatedColors = acc.spread ? new Set<string>() : undefined
            let accentuatedLineIds = new Set<number>()
            for (const [lineId, { color }] of res.entries()) {
                if (accIds.includes(lineId) && color) {
                    accentuatedColors?.add(color)
                    accentuatedLineIds.add(lineId)
                }
            }
            for (const [lineId, {color}] of res.entries()){
                if(!color) continue
                const line = saveStore.getLineById(lineId)
                const isTerrain = line?.type
                const inAccIds = accIds.includes(lineId)
                const accBySpread = accentuatedColors?.has(color)
                const accByTerrain = acc.terrain && isTerrain
                const accByParent = line?.parent && accentuatedLineIds?.has(line?.parent)
                const downplay = !inAccIds && !accBySpread && !accByTerrain && !accByParent
                if(downplay){
                    const newColor = colorProc.colorProcDownplay.convert(color)
                    res.set(lineId, {color:newColor, downplayed:true})
                }
            }
        }
        
        // 根据“时间”设置，对该黑白化的线路进行黑白化
        const runDownplayByTime = 
            typeof timeMoment.value == 'number'
            && (exporting.value || timeConfig.value.enabledPreview)
        if(runDownplayByTime){
            const t = timeMoment.value ?? 999999
            const notOpenLineIds = new Set<number>()
            for (const [lineId, { time, downplayed }] of res.entries()) {
                if(downplayed)
                    continue
                if (typeof time?.open == 'number' && t < time.open){
                    notOpenLineIds.add(lineId)
                }
            }
            for (const [lineId, {color, downplayed}] of res.entries()){
                if(downplayed) continue
                const line = saveStore.getLineById(lineId)
                const inNotOpenIds = notOpenLineIds.has(lineId)
                const notOpenByParent = line?.parent && notOpenLineIds.has(line.parent)
                const downplay = inNotOpenIds || notOpenByParent
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