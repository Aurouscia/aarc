import { defineStore, storeToRefs } from "pinia";
import { computed } from "vue";
import { useSaveStore } from "../saveStore";
import { Line, LineStyle, StyleSlice, TimeSlice } from "@/models/save";

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

export const useFlatSliceStore = defineStore('flatSlice', () => {
    const { save } = storeToRefs(useSaveStore())

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

        // 收集所有切割点（slice 端点 + 线路端点）
        const allCutPts = new Set<number>([pts[0], pts[pts.length - 1]])
        for (const ss of styleSlices) {
            allCutPts.add(ss.fromPt)
            allCutPts.add(ss.toPt)
        }
        for (const ts of timeSlices) {
            allCutPts.add(ts.fromPt)
            allCutPts.add(ts.toPt)
        }

        // 按线路上的顺序排列切割点索引
        const sortedCutPtIndices = pts
            .map((ptId, idx) => ({ ptId, idx }))
            .filter(x => allCutPts.has(x.ptId))
            .map(x => x.idx)

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
                const ssFromIdx = pts.indexOf(ss.fromPt)
                const ssToIdx = pts.indexOf(ss.toPt)
                const ssMin = Math.min(ssFromIdx, ssToIdx)
                const ssMax = Math.max(ssFromIdx, ssToIdx)
                if (ssMin <= fromIdx && toIdx <= ssMax) {
                    styleSliceId = ss.id
                    break // 同类 slice 不重叠，找到一个即可
                }
            }

            // 查找覆盖这个区间的 timeSlice
            let timeSliceId: number | undefined
            for (const ts of timeSlices) {
                const tsFromIdx = pts.indexOf(ts.fromPt)
                const tsToIdx = pts.indexOf(ts.toPt)
                const tsMin = Math.min(tsFromIdx, tsToIdx)
                const tsMax = Math.max(tsFromIdx, tsToIdx)
                if (tsMin <= fromIdx && toIdx <= tsMax) {
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
     * 获取指定线路的扁平化结果
     */
    function getFlattenedLine(lineId: number): FlattenedLine | undefined {
        const line = save.value?.lines.find(l => l.id === lineId)
        if (!line) return undefined
        return flattenLine(line)
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
            const style = save.value?.lineStyles?.find(s => s.id === line.style)
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
    function getSpanTime(lineId: number, spanIdx: number): { timeSlice?: TimeSlice, time?: import('@/models/save').LineTimeInfo, fromLine?: boolean } | undefined {
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

    return {
        allFlattened,
        getFlattenedLine,
        getSpanStyle,
        getSpanTime,
        flattenLine
    }
})
