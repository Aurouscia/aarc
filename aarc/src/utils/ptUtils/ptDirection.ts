import { Coord } from "@/models/coord";
import {
    coordSub,
    coordTo0DistSq,
    makeCoordLength1
} from "@/utils/coordUtils/coordMath";
import { isZero } from "@/utils/sgn";

export interface AdjacentSeg {
    prev?: { pos: Coord }
    next?: { pos: Coord }
}

export interface PtDirectionInfo {
    /** 前一个邻点的位置，以及从当前点指向前一个邻点的单位方向 */
    prev?: { pos: Coord; dir: Coord }
    /** 后一个邻点的位置，以及从当前点指向后一个邻点的单位方向 */
    next?: { pos: Coord; dir: Coord }
    /** 所有非退化方向（去重后，映射到 [0, π) 区间） */
    all: Coord[]
}

/** 将方向映射到 [0, π) 区间：y < 0  flip；y == 0 且 x < 0  flip */
function normalizeDirToRange(dir: Coord): Coord {
    if (dir[1] < 0 || (isZero(dir[1]) && dir[0] < 0)) {
        return [-dir[0], -dir[1]]
    }
    return dir
}

function addUniqueDir(dirs: Coord[], dir: Coord) {
    const normalized = normalizeDirToRange(dir)
    const exists = dirs.some(d =>
        isZero(d[0] - normalized[0]) && isZero(d[1] - normalized[1])
    )
    if (!exists) {
        dirs.push(normalized)
    }
}

/**
 * 根据点的相邻段计算其方向信息。
 *
 * @param pos 当前点坐标
 * @param adjacentSeg 前后相邻点；undefined 表示孤立点
 * @returns 包含 prev/next 方向及所有唯一方向的 PtDirectionInfo
 */
export function computePtDirectionInfo(
    pos: Coord,
    adjacentSeg: AdjacentSeg | undefined
): PtDirectionInfo {
    const res: PtDirectionInfo = { all: [] }
    if (!adjacentSeg) {
        return res
    }

    const prev = adjacentSeg.prev
    const next = adjacentSeg.next

    if (prev !== undefined && !isZero(coordTo0DistSq(coordSub(prev.pos, pos)))) {
        const dir = makeCoordLength1(coordSub(prev.pos, pos))
        res.prev = { pos: prev.pos, dir }
        addUniqueDir(res.all, dir)
    }

    if (next !== undefined && !isZero(coordTo0DistSq(coordSub(next.pos, pos)))) {
        const dir = makeCoordLength1(coordSub(next.pos, pos))
        res.next = { pos: next.pos, dir }
        addUniqueDir(res.all, dir)
    }

    return res
}

/** 只取所有唯一方向 */
export function computePtDirections(
    pos: Coord,
    adjacentSeg: AdjacentSeg | undefined
): Coord[] {
    return computePtDirectionInfo(pos, adjacentSeg).all
}
