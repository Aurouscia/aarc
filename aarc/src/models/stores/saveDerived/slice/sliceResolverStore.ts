import { defineStore, storeToRefs } from "pinia";
import { computed } from "vue";
import { useSaveStore } from "../../saveStore";
import { resolveSliceEndpoints } from "./sliceResolver";
import { Line } from "../../../save";
import { removeInvalidSlices } from "@/models/save/valid/slices";

export interface SliceEndpointIndices {
    fromIdx: number
    toIdx: number
}

export const useSliceResolverStore = defineStore('sliceResolver', () => {
    const saveStore = useSaveStore()
    const { save } = storeToRefs(saveStore)

    // 注册线路点序列变化回调：清除异常 slice
    saveStore.linePtsChanged = (lineIds: number[]) => {
        if (!save.value) return
        removeInvalidSlices(save.value, lineIds)
    }

    const lineMap = computed<Map<number, Line>>(() => {
        const map = new Map<number, Line>()
        for (const line of save.value?.lines || []) {
            map.set(line.id, line)
        }
        return map
    })

    /**
     * 缓存所有 StyleSlice 的解析结果
     * Map<sliceId, {fromIdx, toIdx}>
     */
    const styleSliceIndices = computed<Map<number, SliceEndpointIndices | undefined>>(() => {
        const map = new Map<number, SliceEndpointIndices | undefined>()
        const slices = save.value?.styleSlices
        if (!slices) return map

        for (const slice of slices) {
            const line = lineMap.value.get(slice.line)
            if (!line) {
                map.set(slice.id, undefined)
                continue
            }
            const resolved = resolveSliceEndpoints(line, slice.fromPt, slice.toPt)
            map.set(slice.id, resolved)
        }
        return map
    })

    /**
     * 缓存所有 TimeSlice 的解析结果
     * Map<sliceId, {fromIdx, toIdx}>
     */
    const timeSliceIndices = computed<Map<number, SliceEndpointIndices | undefined>>(() => {
        const map = new Map<number, SliceEndpointIndices | undefined>()
        const slices = save.value?.timeSlices
        if (!slices) return map

        for (const slice of slices) {
            const line = lineMap.value.get(slice.line)
            if (!line) {
                map.set(slice.id, undefined)
                continue
            }
            const resolved = resolveSliceEndpoints(line, slice.fromPt, slice.toPt)
            map.set(slice.id, resolved)
        }
        return map
    })

    return {
        styleSliceIndices,
        timeSliceIndices
    }
})
