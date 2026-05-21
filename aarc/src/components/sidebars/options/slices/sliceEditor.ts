import { Line, LineSliceBase, AnySlice, SliceKind } from "@/models/save";
import { SliceEndpointIndices, useSliceResolverStore } from "@/models/stores/saveDerived/slice/sliceResolverStore";
import { resolveSliceEndpoints } from "@/models/stores/saveDerived/slice/sliceResolver";

/** 判断某点在线路中是否为自交点（出现次数 > 1） */
function isSelfIntersect(line: Line, ptId: number): boolean {
    let count = 0;
    for (const p of line.pts) {
        if (p === ptId) {
            count++;
            if (count > 1) return true;
        }
    }
    return false;
}

/** 检查两个端点是否都是自交点 */
function bothEndsSelfIntersect(line: Line, fromPt: number, toPt: number): boolean {
    return isSelfIntersect(line, fromPt) && isSelfIntersect(line, toPt);
}

export type CellRole = 'start' | 'middle' | 'end' | 'startAndEnd' | 'empty'

export interface CellInfo {
    role: CellRole
    /** 当 role 为 start/end/startAndEnd 时，表示该位置关联的 slice id；
     * startAndEnd 时取 end slice 的 id（靠上的 slice） */
    sliceId?: number
    /** 该单元格是否作为任意 slice 的起点或终点（包括 startAndEnd） */
    isStartOrEnd: boolean
    /** 该单元格是否作为某个 slice 的纯起点或纯终点（排除 startAndEnd） */
    isPureStartOrEnd: boolean
}



/** 判断某行单元格在 slice 列表中的角色
 *
 * 角色语义：
 * - 'start'    : 某 slice 的起点（且不是任何 slice 的终点）
 * - 'end'      : 某 slice 的终点（且不是任何 slice 的起点）
 * - 'startAndEnd': 同时是一个 slice 的终点和另一个 slice 的起点（交界）
 * - 'middle'   : 位于某 slice 内部（非端点）
 * - 'empty'    : 不属于任何 slice
 *
 * sliceId: 当 role 为 start/end/startAndEnd 时有效。
 *   - start/end 时取对应 slice 的 id
 *   - startAndEnd 时取 end slice 的 id（靠上的 slice）
 */
export function getCellInfo(
    slices: LineSliceBase[],
    sliceIndicesMap: Map<number, SliceEndpointIndices | undefined>,
    rowIdx: number
): CellInfo {
    let isStartOfSome = false
    let isEndOfSome = false
    let startSliceId: number | undefined
    let endSliceId: number | undefined
    let middleSliceId: number | undefined

    for (const slice of slices) {
        const resolved = sliceIndicesMap.get(slice.id)
        if (!resolved) continue
        if (rowIdx < resolved.fromIdx || rowIdx > resolved.toIdx) continue

        const isStart = rowIdx === resolved.fromIdx
        const isEnd = rowIdx === resolved.toIdx

        if (isStart) {
            isStartOfSome = true
            startSliceId = slice.id
        }
        if (isEnd) {
            isEndOfSome = true
            endSliceId = slice.id
        }
        if (!isStart && !isEnd) {
            // middle
            middleSliceId = slice.id
        }
    }

    const isStartOrEnd = isStartOfSome || isEndOfSome

    // 优先级：startAndEnd > start > end > middle > empty
    // startAndEnd：同时是某个 slice 的 end 和另一个 slice 的 start
    // 注意：同一 slice 的 from=to（单行 slice）不算 startAndEnd
    if (isEndOfSome && isStartOfSome && endSliceId !== startSliceId) {
        // sliceId 取 end slice 的 id（靠上的 slice）
        return { role: 'startAndEnd', sliceId: endSliceId, isStartOrEnd, isPureStartOrEnd: false }
    }
    if (isStartOfSome) {
        return { role: 'start', sliceId: startSliceId, isStartOrEnd, isPureStartOrEnd: true }
    }
    if (isEndOfSome) {
        return { role: 'end', sliceId: endSliceId, isStartOrEnd, isPureStartOrEnd: true }
    }
    if (middleSliceId !== undefined) {
        return { role: 'middle', sliceId: middleSliceId, isStartOrEnd: false, isPureStartOrEnd: false }
    }
    return { role: 'empty', isStartOrEnd: false, isPureStartOrEnd: false }
}

/** 预计算所有行的 CellInfo，返回 Map<rowIdx, CellInfo> */
export function buildCellInfoMap(
    slices: LineSliceBase[],
    sliceIndicesMap: Map<number, SliceEndpointIndices | undefined>,
    rowCount: number
): Map<number, CellInfo> {
    const map = new Map<number, CellInfo>()
    for (let i = 0; i < rowCount; i++) {
        map.set(i, getCellInfo(slices, sliceIndicesMap, i))
    }
    return map
}

/** 判断某行单元格是否需要显示上半截 bar（任意 slice 的 end 点） */
export function needTopBar(
    slices: LineSliceBase[],
    sliceIndicesMap: Map<number, SliceEndpointIndices | undefined>,
    rowIdx: number
): boolean {
    return slices.some(s => {
        const resolved = sliceIndicesMap.get(s.id)
        if (!resolved) return false
        return rowIdx === resolved.toIdx
    })
}

/** 判断某行单元格是否需要显示下半截 bar（任意 slice 的 start 点） */
export function needBottomBar(
    slices: LineSliceBase[],
    sliceIndicesMap: Map<number, SliceEndpointIndices | undefined>,
    rowIdx: number
): boolean {
    return slices.some(s => {
        const resolved = sliceIndicesMap.get(s.id)
        if (!resolved) return false
        return rowIdx === resolved.fromIdx
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
        const resolved = sliceIndicesMap.get(slice.id)
        if (!resolved) continue
        if (rowIdx === resolved.fromIdx) hasStart = true
        if (rowIdx === resolved.toIdx) hasEnd = true
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
        const resolved = sliceIndicesMap.get(slice.id)
        if (!resolved) continue
        if (rowIdx === resolved.toIdx) endSliceId = slice.id
        if (rowIdx === resolved.fromIdx) startSliceId = slice.id
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
        const resolved = sliceIndicesMap.get(s.id)
        if (!resolved) return false
        return max > resolved.fromIdx && min < resolved.toIdx
    })
}

/** 创建 slice 时，根据用户点击的索引位置计算正确的 fromPt/toPt 存储方式
 * @returns 成功时返回端点，双自交点时返回 'both-self-intersect'，其他歧义返回 undefined
 */
export function computeSliceEndpoints(
    line: Line,
    fromIdx: number,
    toIdx: number
): { fromPt: number; toPt: number } | 'both-self-intersect' | undefined {
    const ptAtFromIdx = line.pts[fromIdx]
    const ptAtToIdx = line.pts[toIdx]

    if (bothEndsSelfIntersect(line, ptAtFromIdx, ptAtToIdx)) {
        return 'both-self-intersect'
    }

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

/** 重设 slice 端点时，计算新的 fromPt/toPt 存储方式
 * @returns 成功时返回端点，双自交点时返回 'both-self-intersect'，其他歧义返回 undefined
 */
export function computeResizeEndpoints(
    line: Line,
    currentIndices: SliceEndpointIndices,
    flashingRowIdx: number,
    newRowIdx: number
): { fromPt: number; toPt: number } | 'both-self-intersect' | undefined {
    const isFlashingStart = flashingRowIdx === currentIndices.fromIdx
    const fixedRowIdx = isFlashingStart ? currentIndices.toIdx : currentIndices.fromIdx

    const fixedPt = line.pts[fixedRowIdx]
    const newPt = line.pts[newRowIdx]

    if (bothEndsSelfIntersect(line, fixedPt, newPt)) {
        return 'both-self-intersect'
    }

    const userMin = Math.min(fixedRowIdx, newRowIdx)
    const userMax = Math.max(fixedRowIdx, newRowIdx)

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

/** 从 sliceResolverStore 缓存中获取解析后的索引
 * fromIdx: 索引较小的（表格中靠上）
 * toIdx: 索引较大的（表格中靠下）
 */
export function getSliceIndices(slice: AnySlice, sliceKind: SliceKind): { fromIdx: number, toIdx: number } | undefined {
    const cache = sliceKind === 'time' ? useSliceResolverStore().timeSliceIndices : useSliceResolverStore().styleSliceIndices
    const resolved = cache.get(slice.id)
    if (!resolved) return undefined
    return { fromIdx: resolved.fromIdx, toIdx: resolved.toIdx }
}
