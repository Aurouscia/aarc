import { collapseWay, Coord, FormalRay, SgnCoord } from "@/models/coord";
import { ControlPoint, ControlPointDir } from "@/models/save";
import { isZero, sgn } from "@/utils/sgn";
import { applyBias } from "@/utils/coordUtils/coordBias";
import { coordDist, coordDistSqLessThan } from "@/utils/coordUtils/coordDist";
import { crossAddNums } from "@/utils/lang/crossAddNums";
import { numberCmpEpsilon, sqrt2half } from "@/utils/consts";
import { rayIntersect } from "@/utils/rayUtils/rayIntersection";

/** 站名吸附的候选方向配置 */
export type StaNameDiagonalMode = 'inner' | 'outer' | 'both'

/**
 * 计算站名吸附的候选偏移坐标。
 * 对应原 snapStore 中 snapStaNameTo 的核心计算。
 */
export function calcStaNameSnapCandidates(
    baseDist: number,
    distRatio: number,
    diagonal: StaNameDiagonalMode
): Coord[] {
    const snd = baseDist * distRatio;
    const sndh = snd * sqrt2half;
    const res: Coord[] = [
        [snd, 0], [-snd, 0], [0, snd], [0, -snd],           // 正交 4 方向
    ];
    if (diagonal === 'inner' || diagonal === 'both') {
        res.push(
            [sndh, sndh], [sndh, -sndh], [-sndh, sndh], [-sndh, -sndh]  // 内侧对角 4 方向（距离 = snd）
        );
    }
    if (diagonal === 'outer' || diagonal === 'both') {
        res.push(
            [snd, snd], [snd, -snd], [-snd, snd], [-snd, -snd]   // 外侧对角 4 方向（距离 = snd*√2）
        );
    }
    return res;
}

/** 站名吸附结果 */
export interface SnapNameResult {
    to: Coord
    type: 'vague' | 'accu'
}

/**
 * 对单个控制点的 nameP 进行吸附判断。
 * 对应原 snapStore 中 snapName 的核心计算。
 */
export function snapNameToCandidates(
    pt: ControlPoint,
    candidates: Coord[],
    snapClingThrsSq: number,
    snapRayThrs: number
): SnapNameResult | undefined {
    if (!pt.nameP) {
        return;
    }
    const to = candidates.find(t => {
        return coordDistSqLessThan(pt.nameP!, t, snapClingThrsSq)
    })
    if (to) {
        return {
            to: [...to] as Coord,
            type: 'accu'
        };
    }

    let [x, y] = pt.nameP;
    let snaped = false;
    if (Math.abs(x) < snapRayThrs) {
        x = 0
        snaped = true;
    }
    if (Math.abs(y) < snapRayThrs) {
        y = 0
        snaped = true;
    }
    if (snaped) {
        return {
            to: [x, y] as Coord,
            type: 'vague'
        };
    }
    return undefined;
}

/**
 * 判断控制点 nameP 当前处于何种吸附状态（不修改值）。
 * 对应原 snapStore 中 snapNameStatus 的核心计算。
 */
export function getNameSnapStatus(
    pt: ControlPoint,
    candidates: Coord[],
    epsSqr: number = numberCmpEpsilon ** 2
): { type: 'vague' | 'accu' } | undefined {
    if (!pt.nameP)
        return;
    const [x, y] = pt.nameP
    const to = candidates.find(t => {
        return coordDistSqLessThan(pt.nameP!, t, epsSqr)
    })
    if (to) {
        return { type: 'accu' };
    }
    if (Math.abs(x) < numberCmpEpsilon || Math.abs(y) < numberCmpEpsilon)
        return { type: 'vague' };
    return undefined;
}

/** 网格吸附结果 */
export interface SnapGridResult {
    pos: Coord
    snapLines: FormalRay[]
}

/**
 * 将坐标吸附到网格。
 * 对应原 snapStore 中 snapGrid 的核心计算，不再直接操作外部 snapLines ref。
 *
 * @param ptPos 当前坐标
 * @param intv 网格间距
 * @param cvsWidth 画布宽度
 * @param cvsHeight 画布高度
 * @param freeAxis 自由度方向，限制只能沿该方向移动
 * @param thrs 吸附阈值
 * @param ensureSnap 为 true 时使用极大阈值，强制吸附到最近网格线
 */
export function snapGrid(
    ptPos: Coord,
    intv: number,
    cvsWidth: number,
    cvsHeight: number,
    freeAxis?: SgnCoord,
    thrs?: number,
    ensureSnap?: boolean
): SnapGridResult | undefined {
    if (!intv)
        return;
    const actualThrs = ensureSnap ? 1000000 : (thrs ?? 6);

    let xDiff = 0;//与足够近的竖线（如果有）的x之差
    let yDiff = 0;//与足够近的横线（如果有）的y之差
    let xMatched = false;//是否距离竖线足够近
    let yMatched = false;//是否距离横线足够近
    const freeWay = collapseWay(freeAxis)

    const a = Math.abs

    //寻找是否有足够近的竖线，如果自由度只有上下就不找
    if (freeWay !== 'vert') {
        let cursor = intv;
        while (cursor < cvsWidth) {
            const xDiffHere = ptPos[0] - cursor
            const xDiffHereAbs = a(xDiffHere)
            if (xDiffHereAbs < actualThrs) {
                xMatched = true
                if (xDiff && xDiffHereAbs > a(xDiff)) {
                    break
                } else {
                    xDiff = xDiffHere
                }
            }
            cursor += intv
        }
    }
    //寻找是否有足够近的横线，如果自由度只有左右就不找
    if (freeWay !== 'hori') {
        let cursor = intv;
        while (cursor < cvsHeight) {
            const yDiffHere = ptPos[1] - cursor
            const yDiffHereAbs = a(yDiffHere)
            if (yDiffHereAbs < actualThrs) {
                yMatched = true
                if (yDiff && yDiffHereAbs > a(yDiff)) {
                    break
                } else {
                    yDiff = yDiffHere
                }
            }
            cursor += intv
        }
    }
    const pos = [...ptPos] as Coord
    const snapLines: FormalRay[] = []
    let snapX = false
    let snapY = false
    if (freeWay === 'vert') {
        pos[1] -= yDiff;
        snapY = yMatched
    } else if (freeWay === 'hori') {
        pos[0] -= xDiff;
        snapX = xMatched
    } else if (freeWay === 'fall' || freeWay === 'rise') {
        let diff = 0;
        if (xMatched) {
            if (!yMatched) {
                //有足够近竖线，但没有足够近横线
                diff = xDiff
                snapX = true
            }
            else {
                //横竖都有足够近的
                const diffSame = freeWay === 'fall' ? (isZero(xDiff - yDiff)) : (isZero(xDiff + yDiff))
                if (diffSame) {
                    //正好横、竖、延长线都能匹配
                    snapX = true
                    snapY = true
                    diff = yDiff
                } else {
                    //没有那么巧
                    const xDiffSmaller = Math.abs(xDiff) < Math.abs(yDiff)
                    if (xDiffSmaller) {
                        diff = xDiff
                        snapX = true
                    } else {
                        diff = yDiff
                        snapY = true
                    }
                }
            }
        }
        else if (yMatched) {
            //有足够近横线，但没有足够近竖线
            diff = yDiff
            snapY = true
        }
        //都没有（什么都不做）

        //应用坐标差，修正位置
        if (freeWay === 'fall') {
            pos[0] -= diff;
            pos[1] -= diff;
        } else {
            if (snapY) {
                pos[0] += diff
                pos[1] -= diff
            } else {
                pos[0] -= diff
                pos[1] += diff
            }
        }
    } else {
        pos[0] -= xDiff;
        pos[1] -= yDiff;
        snapX = xMatched
        snapY = yMatched
    }
    //画吸附线
    if (snapX) {
        snapLines.push(
            { source: [...pos], way: [0, -1] },
            { source: [...pos], way: [0, 1] }
        )
    }
    if (snapY) {
        snapLines.push(
            { source: [...pos], way: [1, 0] },
            { source: [...pos], way: [-1, 0] }
        )
    }
    return { pos, snapLines };
}

/** 邻点延长线吸附结果 */
export interface SnapNeighborExtendsResult {
    snapRes?: Coord
    freeAxis?: SgnCoord
    snapLines: FormalRay[]
}

/**
 * 基于邻点延长线计算吸附位置。
 * 对应原 snapStore 中 snapNeighborExtends 的核心计算。
 */
export function snapNeighborExtends(
    pt: ControlPoint,
    neighbors: ControlPoint[],
    thrs: number,
    onlySameDir: boolean
): SnapNeighborExtendsResult {
    const pos = pt.pos
    const dir = pt.dir
    const cands: { dist: number, snapTo: Coord, source: ControlPoint }[] = []
    const tryCand = (dist: number, snapTo: Coord, source: ControlPoint) => {
        if (cands.length < 2) {
            if (cands.length == 0 || cands[0].dist < dist) {
                cands.push({ dist, snapTo, source })
                return true;
            } else {
                cands[1] = cands[0]
                cands[0] = { dist, snapTo, source };
                return true
            }
        }
        if (dist < cands[0].dist) {
            cands[1] = cands[0]
            cands[0] = { dist, snapTo, source };
            return true
        }
        else if (dist < cands[1].dist) {
            cands[1] = { dist, snapTo, source };
            return true
        }
        return false
    }

    neighbors.forEach(n => {
        if (onlySameDir && dir !== n.dir)
            return
        const xDiff = n.pos[0] - pos[0]
        const yDiff = n.pos[1] - pos[1]
        if (true) {//dir === ControlPointDir.vertical || n.dir === ControlPointDir.vertical){
            const xDiffAbs = Math.abs(xDiff)
            const yDiffAbs = Math.abs(yDiff)
            const dist = Math.min(xDiffAbs, yDiffAbs)
            if (dist < thrs) {
                let snapTo: Coord = [...pos];
                if (tryCand(dist, snapTo, n)) {
                    if (xDiffAbs < yDiffAbs) {
                        snapTo[0] = n.pos[0]
                    } else {
                        snapTo[1] = n.pos[1]
                    }
                }
            }
        }
        if (true) {//dir === ControlPointDir.incline || n.dir === ControlPointDir.incline){
            const diffdiff = xDiff * yDiff > 0 ? (yDiff - xDiff) : (yDiff + xDiff)
            const dist = Math.abs(diffdiff) * sqrt2half
            if (dist < thrs) {
                let snapTo: Coord = [0, 0];
                if (tryCand(dist, snapTo, n)) {
                    if (xDiff * yDiff > 0) {
                        snapTo[0] = pos[0] - diffdiff / 2;
                        snapTo[1] = pos[1] + diffdiff / 2
                    }
                    else {
                        snapTo[0] = pos[0] + diffdiff / 2;
                        snapTo[1] = pos[1] + diffdiff / 2
                    }
                }
            }
        }
    })

    const snapLines: FormalRay[] = []
    if (cands.length > 0) {
        cands.forEach(c => {
            const xDiff = c.snapTo[0] - c.source.pos[0]
            const yDiff = c.snapTo[1] - c.source.pos[1]
            snapLines.push({
                source: c.source.pos,
                way: [
                    sgn(xDiff),
                    sgn(yDiff)
                ]
            })
        })
        const firstCandWay = snapLines[0].way
        if (cands.length > 1) {
            const intersection = rayIntersect(snapLines[0], snapLines[1])
            if (intersection)
                return { snapRes: intersection, snapLines }
        }
        return { snapRes: cands[0].snapTo, freeAxis: firstCandWay, snapLines }
    }
    return { snapLines }
}

/** 点间吸附配置 */
export interface SnapInterPtConfig {
    /** 点间八方向偏置的基础距离（对应 cs.config.snapOctaClingPtPtDist） */
    snapDistBase: number
    /** 吸附阈值 */
    snapThrs: number
}

/** 点间吸附结果 */
export interface SnapInterPtResult {
    matched?: Coord
    targets: {
        snapPoss: Coord[]
        snapToPts: ControlPoint[]
    }
}

/**
 * 计算当前点与附近点之间的八方向吸附。
 * 对应原 snapStore 中 snapInterPt 的核心计算。
 */
export function snapInterPt(
    pt: ControlPoint,
    nearbyPts: ControlPoint[],
    cfg: SnapInterPtConfig,
    getPtSnapSizes?: (id: number) => number[] | undefined,
    noBias?: boolean
): SnapInterPtResult {
    const { snapDistBase, snapThrs } = cfg
    const targets: SnapInterPtResult['targets'] = { snapPoss: [], snapToPts: [] }

    if (nearbyPts.length == 0) {
        return { targets }
    }
    let matched: Coord | undefined = undefined
    let minDist = 10000000;
    for (const opt of nearbyPts) {
        const biases: SgnCoord[] = [[0, 0]]
        if (!noBias) {
            if (pt.dir == ControlPointDir.incline || opt.dir == ControlPointDir.incline) {
                biases.push([-1, -1], [-1, 1], [1, -1], [1, 1])
            }
            if (pt.dir == ControlPointDir.vertical || opt.dir == ControlPointDir.vertical) {
                biases.push([0, -1], [0, 1], [1, 0], [-1, 0])
            }
        }
        const ptSnapSizes = getPtSnapSizes?.(pt.id) ?? [1]
        const optSnapSizes = getPtSnapSizes?.(opt.id) ?? [1]
        const sizesAdded = crossAddNums(ptSnapSizes, optSnapSizes).sort()
        const snapDists = sizesAdded.map(x => x / 2 * snapDistBase)
        targets.snapToPts.push(opt)
        snapDists.forEach(snapDist => {
            biases.forEach(b => {
                const biased = applyBias(opt.pos, b, snapDist)
                targets.snapPoss.push(biased)
                const dist = coordDist(pt.pos, biased)
                if (dist < snapThrs && dist < minDist) {
                    matched = biased;
                    minDist = dist
                }
            })
        })
    }
    return { matched, targets }
}
