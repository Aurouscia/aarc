import { Line, LineSliceBase } from "@/models/save";
import { SliceEndpointIndices } from "@/models/stores/saveDerived/slice/sliceResolverStore";
import { resolveSliceEndpoints } from "@/models/stores/saveDerived/slice/sliceResolver";

export type CellRole = 'start' | 'middle' | 'end' | 'startAndEnd' | 'empty'

export interface CellInfo {
    role: CellRole
    sliceId?: number
    /** 该单元格是否作为任意 slice 的起点或终点（包括 startAndEnd） */
    isStartOrEnd: boolean
}

export interface SliceIndices {
    startIdx: number  // 解析后的较小索引（表格中靠上）
    endIdx: number    // 解析后的较大索引（表格中靠下）
}

/** 从解析结果 Map 中获取 slice 的解析索引（已排序） */
function getSliceIndicesFromMap(
    slice: LineSliceBase,
    sliceIndicesMap: Map<number, SliceEndpointIndices | undefined>
): SliceIndices | undefined {
    const resolved = sliceIndicesMap.get(slice.id)
    if (!resolved) return undefined
    return {
        startIdx: Math.min(resolved.fromIdx, resolved.toIdx),
        endIdx: Math.max(resolved.fromIdx, resolved.toIdx)
    }
}

/** 判断某行单元格在 slice 列表中的角色 */
export function getCellInfo(
    slices: LineSliceBase[],
    sliceIndicesMap: Map<number, SliceEndpointIndices | undefined>,
    rowIdx: number
): CellInfo {
    let isStartOrEnd = false
    let firstMatch: CellInfo | undefined

    for (const slice of slices) {
        const indices = getSliceIndicesFromMap(slice, sliceIndicesMap)
        if (!indices) continue
        if (rowIdx < indices.startIdx || rowIdx > indices.endIdx) continue

        const isStart = rowIdx === indices.startIdx
        const isEnd = rowIdx === indices.endIdx

        if (isStart || isEnd) {
            isStartOrEnd = true
        }

        if (!firstMatch) {
            if (isStart && isEnd) {
                firstMatch = { role: 'startAndEnd', sliceId: slice.id, isStartOrEnd }
            } else if (isStart) {
                firstMatch = { role: 'start', sliceId: slice.id, isStartOrEnd }
            } else if (isEnd) {
                firstMatch = { role: 'end', sliceId: slice.id, isStartOrEnd }
            } else {
                firstMatch = { role: 'middle', sliceId: slice.id, isStartOrEnd }
            }
        }
    }

    if (firstMatch) {
        return { ...firstMatch, isStartOrEnd }
    }
    return { role: 'empty', isStartOrEnd: false }
}

/** 判断某行单元格是否需要显示上半截 bar（任意 slice 的 end 点） */
export function needTopBar(
    slices: LineSliceBase[],
    sliceIndicesMap: Map<number, SliceEndpointIndices | undefined>,
    rowIdx: number
): boolean {
    return slices.some(s => {
        const indices = getSliceIndicesFromMap(s, sliceIndicesMap)
        if (!indices) return false
        return rowIdx === indices.endIdx
    })
}

/** 判断某行单元格是否需要显示下半截 bar（任意 slice 的 start 点） */
export function needBottomBar(
    slices: LineSliceBase[],
    sliceIndicesMap: Map<number, SliceEndpointIndices | undefined>,
    rowIdx: number
): boolean {
    return slices.some(s => {
        const indices = getSliceIndicesFromMap(s, sliceIndicesMap)
        if (!indices) return false
        return rowIdx === indices.startIdx
    })
}

/** 判断某行是否同时属于两个 slice（一个的 end 和另一个的 start） */
export function isSharedBoundary(
    slices: LineSliceBase[],
    sliceIndicesMap: Map<number, SliceEndpointIndices | undefined>,
    rowIdx: number
): boolean {
    let hasStart = false
    let hasEnd = false
    for (const slice of slices) {
        const indices = getSliceIndicesFromMap(slice, sliceIndicesMap)
        if (!indices) continue
        if (rowIdx === indices.startIdx) hasStart = true
        if (rowIdx === indices.endIdx) hasEnd = true
        if (hasStart && hasEnd) return true
    }
    return false
}

/** 根据点击位置（上半/下半）选择对应的 sliceId
 * 上半部分 → 返回 end slice 的 id（靠上的 slice）
 * 下半部分 → 返回 start slice 的 id（靠下的 slice）
 */
export function getSliceIdAtPosition(
    slices: LineSliceBase[],
    sliceIndicesMap: Map<number, SliceEndpointIndices | undefined>,
    rowIdx: number,
    clickYRatio: number  // 0~1，0 表示顶部，1 表示底部
): number | undefined {
    let endSliceId: number | undefined
    let startSliceId: number | undefined

    for (const slice of slices) {
        const indices = getSliceIndicesFromMap(slice, sliceIndicesMap)
        if (!indices) continue
        if (rowIdx === indices.endIdx) endSliceId = slice.id
        if (rowIdx === indices.startIdx) startSliceId = slice.id
    }

    // 上半部分（< 0.5）优先选择 end slice，下半部分（>= 0.5）优先选择 start slice
    if (clickYRatio < 0.5) {
        return endSliceId ?? startSliceId
    } else {
        return startSliceId ?? endSliceId
    }
}

/** 检查给定范围是否与现有 slice 重叠（排除自身） */
export function checkOverlap(
    slices: LineSliceBase[],
    sliceIndicesMap: Map<number, SliceEndpointIndices | undefined>,
    excludeSliceId: number,
    min: number,
    max: number
): boolean {
    return slices.some(s => {
        if (s.id === excludeSliceId) return false
        const indices = getSliceIndicesFromMap(s, sliceIndicesMap)
        if (!indices) return false
        return max > indices.startIdx && min < indices.endIdx
    })
}

/** 创建 slice 时，根据用户点击的索引位置计算正确的 fromPt/toPt 存储方式 */
export function computeSliceEndpoints(
    line: Line,
    fromIdx: number,
    toIdx: number
): { fromPt: number; toPt: number } | undefined {
    const ptAtFromIdx = line.pts[fromIdx]
    const ptAtToIdx = line.pts[toIdx]

    const userMin = Math.min(fromIdx, toIdx)
    const userMax = Math.max(fromIdx, toIdx)

    const opt1 = resolveSliceEndpoints(line, ptAtFromIdx, ptAtToIdx)
    const opt2 = resolveSliceEndpoints(line, ptAtToIdx, ptAtFromIdx)

    if (opt1 && opt1.fromIdx === userMin && opt1.toIdx === userMax) {
        return { fromPt: ptAtFromIdx, toPt: ptAtToIdx }
    }
    if (opt2 && opt2.fromIdx === userMin && opt2.toIdx === userMax) {
        return { fromPt: ptAtToIdx, toPt: ptAtFromIdx }
    }
    return undefined
}

/** 重设 slice 端点时，计算新的 fromPt/toPt 存储方式 */
export function computeResizeEndpoints(
    line: Line,
    currentIndices: SliceIndices,
    flashingRowIdx: number,
    newRowIdx: number
): { fromPt: number; toPt: number } | undefined {
    const isFlashingStart = flashingRowIdx === currentIndices.startIdx
    const fixedRowIdx = isFlashingStart ? currentIndices.endIdx : currentIndices.startIdx

    const userMin = Math.min(fixedRowIdx, newRowIdx)
    const userMax = Math.max(fixedRowIdx, newRowIdx)

    const fixedPt = line.pts[fixedRowIdx]
    const newPt = line.pts[newRowIdx]

    const opt1 = resolveSliceEndpoints(line, fixedPt, newPt)
    const opt2 = resolveSliceEndpoints(line, newPt, fixedPt)

    if (opt1 && opt1.fromIdx === userMin && opt1.toIdx === userMax) {
        return { fromPt: fixedPt, toPt: newPt }
    }
    if (opt2 && opt2.fromIdx === userMin && opt2.toIdx === userMax) {
        return { fromPt: newPt, toPt: fixedPt }
    }
    return undefined
}
