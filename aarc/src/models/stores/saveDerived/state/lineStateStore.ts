import { defineStore, storeToRefs } from "pinia";
import { computed } from "vue";
import { useSaveStore } from "../../saveStore";
import { useConfigStore } from "../../configStore";
import { Line, LineTimeInfo } from "@/models/save";
import { useRenderOptionsStore } from "../../renderOptionsStore";
import { useColorProcStore } from "../../utils/colorProcStore";
import { useLineSpanStore } from "../lineSpanStore";

export const useLineStateStore = defineStore('lineState', () => {
    const saveStore = useSaveStore()
    const { save } = storeToRefs(saveStore)
    const { 
        accentuationLineIds, accentuationEnabled, accentuationConfig,
        effectiveTimeMoment, timeConfig,
        exporting 
    } = storeToRefs(useRenderOptionsStore())
    const configStore = useConfigStore()
    const colorProc = useColorProcStore()
    const lineSpanStore = useLineSpanStore()

    const lineActualColors = computed<Map<number, {color:string, downplayed?:boolean, downplayedBy?: 'accentuation' | 'time'}>>(() => {
        const res: Map<number, {
            color: string
            time?: LineTimeInfo,
            downplayed?: boolean
            downplayedBy?: 'accentuation' | 'time'
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
            typeof effectiveTimeMoment.value == 'number'
            && (exporting.value || timeConfig.value.enabledPreview)
        if(runDownplayByTime){
            const t = effectiveTimeMoment.value ?? 999999
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
                    res.set(lineId, {color:newColor, downplayed:true, downplayedBy: 'time'})
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

    /**
     * 获取指定线路指定 span 的实际颜色
     * 
     * 逻辑：
     * 1. 先取整线基础色（与 lineActualColors 一致）
     * 2. 如果该 span 有独立的时间状态（TimeSlice 或 Line.time），按时间判断是否淡化
     * 3. 如果整线已被淡化（lineActualColors 中 downplayed），span 也淡化
     * 4. 强调淡化保持整线级别（不细分到 span）
     */
    /**
     * 判断是否应该运行时间淡化逻辑
     */
    function shouldRunDownplayByTime(): boolean {
        return typeof effectiveTimeMoment.value == 'number'
            && (exporting.value || timeConfig.value.enabledPreview === true)
    }

    /**
     * 判断给定时间信息是否应该被淡化
     */
    function isTimeDownplayed(time?: LineTimeInfo): boolean {
        if (!shouldRunDownplayByTime() || !time) return false
        const t = effectiveTimeMoment.value ?? 999999
        return typeof time.open == 'number' && t < time.open
    }

    function getSpanActualColor(lineId: number, spanIdx: number): string | undefined {
        const line = saveStore.getLineById(lineId)
        if (!line) return undefined

        // 计算基础色（处理 colorPre，但不考虑时间淡化）
        let baseColor = line.color
        if (line.colorPre) {
            baseColor = configStore.getPresetColor(line.colorPre)
        }

        // 如果整线已被强调淡化，span 直接继承淡化色
        if (lineActualColors.value.get(lineId)?.downplayedBy === 'accentuation') {
            return lineActualColors.value.get(lineId)?.color || baseColor
        }

        // 检查 span 的时间状态
        const spanTimeInfo = lineSpanStore.getSpanTime(lineId, spanIdx)
        if (isTimeDownplayed(spanTimeInfo?.time)) {
            return colorProc.colorProcDownplay.convert(baseColor)
        }

        return baseColor
    }

    /**
     * 获取指定线路指定 span 是否被淡化
     */
    function isSpanDownplayed(lineId: number, spanIdx: number): boolean {
        if (lineActualColors.value.get(lineId)?.downplayedBy === 'accentuation') return true

        const spanTimeInfo = lineSpanStore.getSpanTime(lineId, spanIdx)
        return isTimeDownplayed(spanTimeInfo?.time)
    }

    return {
        lineActualColors,
        getLineActualColor,
        getLineActualColorById,
        isLineDownplayed,
        getSpanActualColor,
        isSpanDownplayed
    }
})