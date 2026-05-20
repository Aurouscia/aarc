import { Line, LineSliceBase } from "@/models/save";
import { SliceEndpointIndices } from "@/models/stores/saveDerived/slice/sliceResolverStore";
import { resolveSliceEndpoints } from "@/models/stores/saveDerived/slice/sliceResolver";

export type CellRole = 'start' | 'middle' | 'end' | 'empty'

export interface CellInfo {
    role: CellRole
    sliceId?: number
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
    for (const slice of slices) {
        const indices = getSliceIndicesFromMap(slice, sliceIndicesMap)
        if (!indices) continue
        if (rowIdx < indices.startIdx || rowIdx > indices.endIdx) continue
        if (rowIdx === indices.startIdx) return { role: 'start', sliceId: slice.id }
        if (rowIdx === indices.endIdx) return { role: 'end', sliceId: slice.id }
        return { role: 'middle', sliceId: slice.id }
    }
    return { role: 'empty' }
}

/** 判断某行单元格是否需要显示上半截 bar */
export function needTopBar(
    slices: LineSliceBase[],
    sliceIndicesMap: Map<number, SliceEndpointIndices | undefined>,
    rowIdx: number
): boolean {
    const info = getCellInfo(slices, sliceIndicesMap, rowIdx)
    if (info.role !== 'start' && info.role !== 'end') return false
    const slice = slices.find(s => s.id === info.sliceId)
    if (!slice) return false
    const indices = getSliceIndicesFromMap(slice, sliceIndicesMap)
    if (!indices) return false
    return rowIdx === indices.endIdx
}

/** 判断某行单元格是否需要显示下半截 bar */
export function needBottomBar(
    slices: LineSliceBase[],
    sliceIndicesMap: Map<number, SliceEndpointIndices | undefined>,
    rowIdx: number
): boolean {
    const info = getCellInfo(slices, sliceIndicesMap, rowIdx)
    if (info.role !== 'start' && info.role !== 'end') return false
    const slice = slices.find(s => s.id === info.sliceId)
    if (!slice) return false
    const indices = getSliceIndicesFromMap(slice, sliceIndicesMap)
    if (!indices) return false
    return rowIdx === indices.startIdx
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
        return !(max < indices.startIdx || min > indices.endIdx)
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
