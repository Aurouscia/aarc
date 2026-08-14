import { ControlPoint, ControlPointLink, ControlPointSta } from "@/models/save";
import { Coord } from '@/models/coord';
import { coordDistSq, coordDistSqLessThan } from "@/utils/coordUtils/coordDist";
import { coordAdd, coordSub } from "@/utils/coordUtils/coordMath";
import { computeFreeSnapCandidates, type PtDirectionInfo } from "@/utils/snapUtils/snapInterPtFree";

export type Neighbors = Record<number, Set<number> | undefined>;

export interface PtSnapCandidatesInfo {
    candidates: Coord[]
    reach: number
    bbox: { minX: number; maxX: number; minY: number; maxY: number }
}

export interface StaNameTransfer {
    fromId: number
    toId: number
    name: string
    nameS?: string
    nameP: Coord
}

export interface StaNameResult {
    name: string
    nameSub: string
    ptId: number
}

export function getCandidatesBbox(candidates: Coord[]): PtSnapCandidatesInfo['bbox'] {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const c of candidates) {
        if (c[0] < minX) minX = c[0]
        if (c[0] > maxX) maxX = c[0]
        if (c[1] < minY) minY = c[1]
        if (c[1] > maxY) maxY = c[1]
    }
    return { minX, maxX, minY, maxY }
}

/**
 * 获取点的吸附候选位置及其在 x/y 轴上的最大偏移（reach）。
 * 对 free 点使用两侧线段方向生成候选（含平行线交点）；
 * 非 free 点退化为 [pt.pos]，reach 为 0。
 */
export function getPtSnapCandidatesAndReachPure(
    pt: ControlPoint,
    getSnapSize: (id: number) => number,
    getDirectionInfo: (id: number) => PtDirectionInfo | undefined,
    configClingingDist: number
): PtSnapCandidatesInfo {
    const size = getSnapSize(pt.id)
    const snapDist = size * configClingingDist
    const directionInfo = getDirectionInfo(pt.id)
    const candidates = computeFreeSnapCandidates(pt, snapDist, directionInfo)
    let reach = 0
    for (const c of candidates) {
        const dx = Math.abs(c[0] - pt.pos[0])
        const dy = Math.abs(c[1] - pt.pos[1])
        if (dx > reach) reach = dx
        if (dy > reach) reach = dy
    }
    return { candidates, reach, bbox: getCandidatesBbox(candidates) }
}

export function bboxesCouldCling(
    bboxA: PtSnapCandidatesInfo['bbox'],
    bboxB: PtSnapCandidatesInfo['bbox'],
    dist: number
): boolean {
    if (bboxA.minX - bboxB.maxX > dist || bboxB.minX - bboxA.maxX > dist) return false
    if (bboxA.minY - bboxB.maxY > dist || bboxB.minY - bboxA.maxY > dist) return false
    return true
}

/**
 * 判断两个点是否“吸附”到需要被划入同一个 cluster 的程度
 * @param configClingingDist 全局配置的基础吸附距离
 * @param getSnapSize 根据点 ID 获取该点用于吸附距离计算的尺寸
 * @param epsilon 浮点数比较容差
 * @param aSnap 点 A 的吸附候选信息（仅 free 相关逻辑使用），不传时退化为标准位置判断
 * @param bSnap 点 B 的吸附候选信息
 */
export function ptClingingPure(
    a: ControlPoint,
    b: ControlPoint,
    configClingingDist: number,
    getSnapSize: (id: number) => number,
    epsilon: number,
    aSnap?: PtSnapCandidatesInfo,
    bSnap?: PtSnapCandidatesInfo
): boolean {
    const sizeA = getSnapSize(a.id)
    const sizeB = getSnapSize(b.id)
    const distMut = (sizeA + sizeB) / 2
    const clingingDist = configClingingDist * distMut
    const clingingDistSqrBiggerByEpsilon = (clingingDist + epsilon * 10) ** 2

    if (aSnap && bSnap) {
        if (!bboxesCouldCling(aSnap.bbox, bSnap.bbox, clingingDist))
            return false
        for (const ca of aSnap.candidates) {
            for (const cb of bSnap.candidates) {
                if (coordDistSqLessThan(ca, cb, clingingDistSqrBiggerByEpsilon))
                    return true
            }
        }
        return false
    }

    return !!coordDistSqLessThan(a.pos, b.pos, clingingDistSqrBiggerByEpsilon)
}

function cloneNeighbors(neighbors: Neighbors): Neighbors {
    const res: Neighbors = {}
    for (const [key, set] of Object.entries(neighbors)) {
        if (set) {
            res[Number(key)] = new Set(set)
        }
    }
    return res
}

function getGridKey(x: number, y: number, cellSize: number): string {
    return `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`
}

/**
 * 根据所有点构建邻接表
 * 只考虑 sta 类型的点，使用均匀网格索引将时间复杂度从 O(n^2) 降到 O(n*k)
 * （k 为单个网格及周围 8 格内平均点数）
 * @param getSnapCandidates 可选；提供时会把 free 点吸附候选也纳入判断，
 * 否则退化为标准位置判断（与 master 版本一致）
 */
export function buildNeighbors(
    pts: ControlPoint[],
    configClingingDist: number,
    getSnapSize: (id: number) => number,
    epsilon: number,
    getSnapCandidates?: (pt: ControlPoint) => PtSnapCandidatesInfo
): Neighbors {
    const neighbors: Neighbors = {}
    const skipThrs = 2.5 * configClingingDist
    const cellSize = skipThrs
    const staPts = pts.filter(pt => pt.sta == ControlPointSta.sta)
    if (skipThrs <= 0 || staPts.length === 0)
        return neighbors

    const grid = new Map<string, ControlPoint[]>()
    for (const pt of staPts) {
        const key = getGridKey(pt.pos[0], pt.pos[1], cellSize)
        const cell = grid.get(key)
        if (cell)
            cell.push(pt)
        else
            grid.set(key, [pt])
    }

    // 标准位置判断路径（与 master 版本一致）
    if (!getSnapCandidates) {
        for (const pt of staPts) {
            const cx = Math.floor(pt.pos[0] / cellSize)
            const cy = Math.floor(pt.pos[1] / cellSize)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const cell = grid.get(`${cx + dx},${cy + dy}`)
                    if (!cell)
                        continue
                    for (const other of cell) {
                        if (other.id <= pt.id)
                            continue
                        if (Math.abs(pt.pos[0] - other.pos[0]) > skipThrs)
                            continue
                        if (Math.abs(pt.pos[1] - other.pos[1]) > skipThrs)
                            continue
                        if (ptClingingPure(pt, other, configClingingDist, getSnapSize, epsilon)) {
                            if (!neighbors[pt.id])
                                neighbors[pt.id] = new Set<number>()
                            if (!neighbors[other.id])
                                neighbors[other.id] = new Set<number>()
                            neighbors[pt.id]?.add(other.id)
                            neighbors[other.id]?.add(pt.id)
                        }
                    }
                }
            }
        }
        return neighbors
    }

    // 带吸附候选的路径：支持 free 点平行线交点等候选位置
    const snapInfo = new Map<number, PtSnapCandidatesInfo>()
    let maxReach = 0
    for (const pt of staPts) {
        const info = getSnapCandidates(pt)
        snapInfo.set(pt.id, info)
        if (info.reach > maxReach)
            maxReach = info.reach
    }

    const cellRadius = maxReach > 0 ? Math.ceil((skipThrs + 2 * maxReach) / cellSize) : 1

    for (const pt of staPts) {
        const cx = Math.floor(pt.pos[0] / cellSize)
        const cy = Math.floor(pt.pos[1] / cellSize)
        const ptSnap = snapInfo.get(pt.id)!
        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                const cell = grid.get(`${cx + dx},${cy + dy}`)
                if (!cell)
                    continue
                for (const other of cell) {
                    if (other.id <= pt.id)
                        continue
                    const otherSnap = snapInfo.get(other.id)!
                    const checkThrs = skipThrs + ptSnap.reach + otherSnap.reach
                    if (Math.abs(pt.pos[0] - other.pos[0]) > checkThrs)
                        continue
                    if (Math.abs(pt.pos[1] - other.pos[1]) > checkThrs)
                        continue
                    if (ptClingingPure(pt, other, configClingingDist, getSnapSize, epsilon, ptSnap, otherSnap)) {
                        if (!neighbors[pt.id])
                            neighbors[pt.id] = new Set<number>()
                        if (!neighbors[other.id])
                            neighbors[other.id] = new Set<number>()
                        neighbors[pt.id]?.add(other.id)
                        neighbors[other.id]?.add(pt.id)
                    }
                }
            }
        }
    }
    return neighbors
}

export function expandSetInNeighbors(neighbors: Neighbors, formingIds: Set<number>, current: number) {
    if (formingIds.has(current))
        return
    formingIds.add(current)
    const currentNeibs = neighbors[current]
    if (!currentNeibs)
        return
    for (const neib of currentNeibs) {
        expandSetInNeighbors(neighbors, formingIds, neib)
    }
}

/**
 * 由邻接表生成 cluster 列表
 */
export function makeClustersFromNeighborsPure(
    neighbors: Neighbors,
    getPtById: (id: number) => ControlPoint | undefined
): ControlPoint[][] {
    const usedPtIds = new Set<number>()
    const clusters: ControlPoint[][] = []
    for (const pt of Object.entries(neighbors)) {
        const ptId = Number(pt[0])
        if (usedPtIds.has(ptId))
            continue
        const ptNeibs = pt[1]
        if (ptNeibs && ptNeibs.size > 0) {
            const newClusterIds = new Set<number>()
            expandSetInNeighbors(neighbors, newClusterIds, ptId)
            if (newClusterIds.size > 0) {
                const newCluster: ControlPoint[] = []
                for (const id of newClusterIds) {
                    if (usedPtIds.has(id))
                        continue
                    const addingPt = getPtById(id)
                    if (addingPt) {
                        newCluster.push(addingPt)
                        usedPtIds.add(id)
                    }
                }
                if (newCluster.length > 0)
                    clusters.push(newCluster)
            }
        }
    }
    return clusters
}

/**
 * 当某个点位置或状态发生变化时，更新邻接表
 * 返回新的邻接表（不会修改输入）
 */
export function updateNeighborsForMovedPt(
    neighbors: Neighbors,
    pt: ControlPoint,
    allPts: ControlPoint[],
    configClingingDist: number,
    getSnapSize: (id: number) => number,
    epsilon: number,
    getSnapCandidates?: (pt: ControlPoint) => PtSnapCandidatesInfo
): Neighbors {
    const next = cloneNeighbors(neighbors)
    let neibs = next[pt.id]
    if (neibs) {
        for (const neib of neibs) {
            const neibNeibs = next[neib]
            if (neibNeibs) {
                neibNeibs.delete(pt.id)
            }
        }
        neibs.clear()
    } else {
        neibs = new Set<number>()
        next[pt.id] = neibs
    }
    if (pt.sta !== ControlPointSta.sta) {
        return next
    }
    const ptSnap = getSnapCandidates ? getSnapCandidates(pt) : undefined
    for (const otherPt of allPts) {
        if (otherPt.sta !== ControlPointSta.sta || otherPt.id === pt.id)
            continue
        const otherSnap = getSnapCandidates ? getSnapCandidates(otherPt) : undefined
        if (ptSnap && otherSnap) {
            const checkThrs = 2.5 * configClingingDist + ptSnap.reach + otherSnap.reach
            if (Math.abs(pt.pos[0] - otherPt.pos[0]) > checkThrs)
                continue
            if (Math.abs(pt.pos[1] - otherPt.pos[1]) > checkThrs)
                continue
        }
        if (ptClingingPure(pt, otherPt, configClingingDist, getSnapSize, epsilon, ptSnap, otherSnap)) {
            neibs.add(otherPt.id)
            if (!next[otherPt.id])
                next[otherPt.id] = new Set<number>()
            next[otherPt.id]?.add(pt.id)
        }
    }
    return next
}

/**
 * 当某个点被删除时，清理邻接表
 * 返回新的邻接表（不会修改输入）
 */
export function cleanNeighborsForDeletedPt(
    neighbors: Neighbors,
    ptId: number
): Neighbors {
    const next = cloneNeighbors(neighbors)
    const neibs = next[ptId]
    if (!neibs)
        return next
    for (const neib of neibs) {
        const neibNeibs = next[neib]
        if (neibNeibs) {
            neibNeibs.delete(ptId)
        }
    }
    delete next[ptId]
    return next
}

/**
 * 尝试把某点的站名标注转移到同 cluster 中距离站名位置更近的点上
 * 返回描述转移的对象；若无需转移则返回 undefined
 */
export function tryTransferStaNameWithinClusterPure(
    sta: ControlPoint,
    cluster: ControlPoint[]
): StaNameTransfer | undefined {
    if (!sta.nameP)
        return undefined
    const nameGlobalPos = coordAdd(sta.pos, sta.nameP)
    const originalDistSq = coordDistSq(sta.pos, nameGlobalPos)
    const transferThrs = 200
    let minDistSq = 1e10
    let closestPt: ControlPoint | undefined
    cluster.forEach(pt => {
        if (pt.id === sta.id)
            return
        const distSq = coordDistSq(pt.pos, nameGlobalPos)
        if (distSq < minDistSq) {
            minDistSq = distSq
            closestPt = pt
        }
    })
    if (closestPt && originalDistSq - minDistSq > transferThrs) {
        const relPosToClosest = coordSub(nameGlobalPos, closestPt.pos)
        return {
            fromId: sta.id,
            toId: closestPt.id,
            name: sta.name ?? '',
            nameS: sta.nameS,
            nameP: relPosToClosest
        }
    }
    return undefined
}

export function getClusterMaxSizePure(
    cluster: ControlPoint[] | undefined,
    getSize: (id: number) => number,
    fallbackPtId?: number
): number {
    const ids = cluster && cluster.length > 0
        ? cluster.map(x => x.id)
        : (fallbackPtId !== undefined ? [fallbackPtId] : [])
    const sizes = ids.map(id => getSize(id))
    if (sizes.length === 0)
        return 1
    return Math.max(...sizes)
}

export function getMaxSizePtWithinClusterPure(
    ptId: number,
    clusters: ControlPoint[][],
    getSize: (id: number) => number
): number {
    const cluster = clusters.find(c => c.find(p => p.id === ptId))
    return getClusterMaxSizePure(cluster, getSize, ptId)
}

export function getRectOfClusterPure(cluster: ControlPoint[]): Coord[] {
    const xs = cluster.map(x => x.pos[0])
    const ys = cluster.map(x => x.pos[1])
    const maxX = Math.max(...xs)
    const minX = Math.min(...xs)
    const maxY = Math.max(...ys)
    const minY = Math.min(...ys)
    return [
        [maxX, maxY],
        [maxX, minY],
        [minX, maxY],
        [minX, minY]
    ]
}

export function getStaClusterByIdPure(
    ptId: number,
    clusters: ControlPoint[][],
    getPtById: (id: number) => ControlPoint | undefined
): ControlPoint[] {
    const cluster = clusters.find(c => c.some(sta => sta.id === ptId))
    if (!cluster) {
        const point = getPtById(ptId)
        if (!point) return []
        return [point]
    }
    return cluster
}

export function isPtSinglePure(ptId: number, clusters: ControlPoint[][]): boolean {
    const cluster = clusters.find(c => c.some(sta => sta.id === ptId))
    return !cluster || cluster.length <= 1
}

/**
 * 解析某点应显示的站名
 * 优先返回本点名称；若无，则通过 cluster 与 pointLinks 做 BFS 查找最近的有名站点
 */
export function resolveStaNamePure(
    ptId: number,
    raw: boolean,
    points: ControlPoint[],
    pointLinks: ControlPointLink[],
    clusters: ControlPoint[][]
): StaNameResult {
    const pt = points.find(p => p.id === ptId)
    if (pt?.name) {
        return {
            name: raw ? pt.name : pt.name.replaceAll('\n', ''),
            nameSub: raw ? (pt.nameS ?? '') : (pt.nameS?.replaceAll('\n', '') ?? ''),
            ptId
        }
    }

    const allClusters: ControlPoint[][] = [...clusters]
    const clusteredPtIds = new Set<number>()
    allClusters.forEach(c => c.forEach(p => clusteredPtIds.add(p.id)))
    for (const p of points) {
        if (!clusteredPtIds.has(p.id)) {
            allClusters.push([p])
        }
    }

    const ptToClusterIdx: Record<number, number> = {}
    allClusters.forEach((c, idx) => c.forEach(p => ptToClusterIdx[p.id] = idx))

    const clusterAdj: Record<number, Set<number>> = {}
    pointLinks.forEach(link => {
        const c1 = ptToClusterIdx[link.pts[0]]
        const c2 = ptToClusterIdx[link.pts[1]]
        if (c1 === undefined || c2 === undefined || c1 === c2) return
        if (!clusterAdj[c1]) clusterAdj[c1] = new Set()
        if (!clusterAdj[c2]) clusterAdj[c2] = new Set()
        clusterAdj[c1].add(c2)
        clusterAdj[c2].add(c1)
    })

    const startIdx = ptToClusterIdx[ptId]
    if (startIdx !== undefined) {
        const visited = new Set<number>([startIdx])
        const queue: number[] = [startIdx]
        while (queue.length > 0) {
            const currIdx = queue.shift()!
            const currCluster = allClusters[currIdx]
            const namedPt = currCluster.find(x => x.name)
            if (namedPt && namedPt.name) {
                return {
                    name: raw ? namedPt.name : namedPt.name.replaceAll('\n', ''),
                    nameSub: raw ? (namedPt.nameS ?? '') : (namedPt.nameS?.replaceAll('\n', '') ?? ''),
                    ptId: namedPt.id
                }
            }
            for (const neib of (clusterAdj[currIdx] || [])) {
                if (!visited.has(neib)) {
                    visited.add(neib)
                    queue.push(neib)
                }
            }
        }
    }
    return { name: `#${ptId}`, nameSub: '', ptId }
}
