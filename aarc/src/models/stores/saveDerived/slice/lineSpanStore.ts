import { defineStore, storeToRefs } from "pinia";
import { computed } from "vue";
import { useSaveStore } from "../../saveStore";
import { useSliceResolverStore } from "./sliceResolverStore";
import { Line, LineStyle, LineTimeInfo, StyleSlice, TimeSlice } from "@/models/save";

/** 扁平化后的原子区间 */
export interface FlatSpan {
    /** 在线路点序列中的起始索引 */
    fromIdx: number
    /** 在线路点序列中的结束索引 */
    toIdx: number
    /** 起始点ID */
    fromPt: number
    /** 结束点ID */
    toPt: number
    /** 应用的样式片段ID，无slice覆盖时回退到Line.style，此时为undefined */
    styleSliceId?: number
    /** 应用的时间片段ID，无slice覆盖时回退到Line.time，此时为undefined */
    timeSliceId?: number
}

/** 单条线路的扁平化结果 */
export interface FlattenedLine {
    lineId: number
    spans: FlatSpan[]
}

export const useLineSpanStore = defineStore('lineSpan', () => {
    const { save } = storeToRefs(useSaveStore())
    const sliceResolverStore = useSliceResolverStore()

    /**
     * 扁平化单条线路的所有 slice
     * 
     * 算法：
     * 1. 收集所有 slice 的端点作为切割点
     * 2. 加上线路的起点和终点
     * 3. 按线路上的顺序排列切割点
     * 4. 相邻切割点之间形成原子区间
     * 5. 每个原子区间标注覆盖它的 styleSlice 和 timeSlice
     */
    function flattenLine(line: Line): FlattenedLine {
        const pts = line.pts
        if (pts.length < 2) {
            return { lineId: line.id, spans: [] }
        }

        const styleSlices = save.value?.styleSlices?.filter(s => s.line === line.id) || []
        const timeSlices = save.value?.timeSlices?.filter(s => s.line === line.id) || []

        // 没有任何 slice，整条线路作为一个 flatSpan
        if (styleSlices.length === 0 && timeSlices.length === 0) {
            return {
                lineId: line.id,
                spans: [{
                    fromIdx: 0,
                    toIdx: pts.length - 1,
                    fromPt: pts[0],
                    toPt: pts[pts.length - 1]
                }]
            }
        }

        // 收集所有切割点（slice 端点索引 + 线路端点）
        const allCutIndices = new Set<number>([0, pts.length - 1])
        for (const ss of styleSlices) {
            const resolved = sliceResolverStore.styleSliceIndices.get(ss.id)
            if (resolved) {
                allCutIndices.add(resolved.fromIdx)
                allCutIndices.add(resolved.toIdx)
            }
        }
        for (const ts of timeSlices) {
            const resolved = sliceResolverStore.timeSliceIndices.get(ts.id)
            if (resolved) {
                allCutIndices.add(resolved.fromIdx)
                allCutIndices.add(resolved.toIdx)
            }
        }

        // 按线路上的顺序排列切割点索引
        const sortedCutPtIndices = Array.from(allCutIndices).sort((a, b) => a - b)

        // 生成原子区间
        const spans: FlatSpan[] = []
        for (let i = 0; i < sortedCutPtIndices.length - 1; i++) {
            const fromIdx = sortedCutPtIndices[i]
            const toIdx = sortedCutPtIndices[i + 1]
            const fromPt = pts[fromIdx]
            const toPt = pts[toIdx]

            // 查找覆盖这个区间的 styleSlice
            let styleSliceId: number | undefined
            for (const ss of styleSlices) {
                const resolved = sliceResolverStore.styleSliceIndices.get(ss.id)
                if (!resolved) continue
                if (resolved.fromIdx <= fromIdx && toIdx <= resolved.toIdx) {
                    styleSliceId = ss.id
                    break // 同类 slice 不重叠，找到一个即可
                }
            }

            // 查找覆盖这个区间的 timeSlice
            let timeSliceId: number | undefined
            for (const ts of timeSlices) {
                const resolved = sliceResolverStore.timeSliceIndices.get(ts.id)
                if (!resolved) continue
                if (resolved.fromIdx <= fromIdx && toIdx <= resolved.toIdx) {
                    timeSliceId = ts.id
                    break
                }
            }

            spans.push({
                fromIdx,
                toIdx,
                fromPt,
                toPt,
                styleSliceId,
                timeSliceId
            })
        }

        return { lineId: line.id, spans }
    }

    /**
     * 扁平化所有线路
     */
    const allFlattened = computed<FlattenedLine[]>(() => {
        const lines = save.value?.lines || []
        return lines.map(line => flattenLine(line))
    })

    /**
     * 所有扁平化结果的 Map 索引（lineId -> FlattenedLine）
     */
    const flattenedMap = computed<Map<number, FlattenedLine>>(() => {
        const map = new Map<number, FlattenedLine>()
        for (const fl of allFlattened.value) {
            map.set(fl.lineId, fl)
        }
        return map
    })

    /**
     * 获取指定线路的扁平化结果
     */
    function getFlattenedLine(lineId: number): FlattenedLine | undefined {
        return flattenedMap.value.get(lineId)
    }

    /**
     * 获取指定线路指定区间的样式信息
     * 
     * 优先级：StyleSlice > Line.style（回退）
     * 返回值中 styleSlice 表示是否来自 slice，style 为实际应用的样式
     */
    function getSpanStyle(lineId: number, spanIdx: number): { styleSlice?: StyleSlice, style?: LineStyle, fromLine?: boolean } | undefined {
        const flattened = getFlattenedLine(lineId)
        if (!flattened) return undefined
        const span = flattened.spans[spanIdx]
        if (!span) return undefined

        // 优先查找 StyleSlice
        if (span.styleSliceId) {
            const styleSlice = save.value?.styleSlices?.find(s => s.id === span.styleSliceId)
            if (styleSlice) {
                const style = save.value?.lineStyles?.find(s => s.id === styleSlice.style)
                return { styleSlice, style }
            }
        }

        // 回退到 Line 自身的 style
        const line = save.value?.lines.find(l => l.id === lineId)
        if (line?.style) {
            let sid = line?.style
            if(sid == -1 && line.parent){
                // -1 表示跟随主线，从主线获取
                const parent = useSaveStore().getLineById(line.parent)
                sid = parent?.style || 0
            }
            const style = save.value?.lineStyles?.find(s => s.id === sid)
            if (style) {
                return { style, fromLine: true }
            }
        }

        return undefined
    }

    /**
     * 获取指定线路指定区间的时间信息
     * 
     * 优先级：TimeSlice > Line.time（回退）
     */
    function getSpanTime(lineId: number, spanIdx: number): { timeSlice?: TimeSlice, time?: LineTimeInfo, fromLine?: boolean } | undefined {
        const flattened = getFlattenedLine(lineId)
        if (!flattened) return undefined
        const span = flattened.spans[spanIdx]
        if (!span) return undefined

        // 优先查找 TimeSlice
        if (span.timeSliceId) {
            const timeSlice = save.value?.timeSlices?.find(s => s.id === span.timeSliceId)
            if (timeSlice) {
                return { timeSlice, time: timeSlice.time }
            }
        }

        // 回退到 Line 自身的 time
        const line = save.value?.lines.find(l => l.id === lineId)
        if (line?.time) {
            return { time: line.time, fromLine: true }
        }

        return undefined
    }

    /**
     * 判断指定线路指定区间在当前 effectiveTimeMoment 下是否已开通
     * 
     * 逻辑：
     * 1. 无时间信息（无 Line.time 也无 TimeSlice）→ 视为已开通（始终显示）
     * 2. 有 time.open → 比较 open <= effectiveTimeMoment
     * 3. 无 time.open → 视为已开通
     * 
     * 注意：此函数不读取 exporting / preview 开关，调用方自行判断是否需要过滤
     */
    function isSpanOpened(lineId: number, spanIdx: number, timeMoment: number): boolean {
        const spanTime = getSpanTime(lineId, spanIdx)
        const time = spanTime?.time
        if (!time) return true
        if (typeof time.open !== 'number') return true
        return time.open <= timeMoment
    }

    return {
        allFlattened,
        getFlattenedLine,
        getSpanStyle,
        getSpanTime,
        isSpanOpened,
        flattenLine
    }
})
