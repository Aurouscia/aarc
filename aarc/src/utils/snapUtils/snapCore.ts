import { Coord, FreeRay, SgnCoord } from "@/models/coord";
import { ControlPoint, ControlPointDir } from "@/models/save";
import { isZero } from "@/utils/sgn";
import { applyBias } from "@/utils/coordUtils/coordBias";
import { coordDist, coordDistSqLessThan } from "@/utils/coordUtils/coordDist";
import { crossAddNums } from "@/utils/lang/crossAddNums";
import { numberCmpEpsilon, sqrt2half } from "@/utils/consts";
import { freeRayIntersect } from "@/utils/rayUtils/rayIntersection";

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
    snapLines: FreeRay[]
}

/**
 * 将坐标吸附到网格。
 * 对应原 snapStore 中 snapGrid 的核心计算，不再直接操作外部 snapLines ref。
 *
 * @param ptPos 当前坐标
 * @param intv 网格间距
 * @param cvsWidth 画布宽度
 * @param cvsHeight 画布高度
 * @param freeWay 自由度方向（单位向量），限制只能沿该方向移动
 * @param thrs 吸附阈值
 * @param ensureSnap 为 true 时使用极大阈值，强制吸附到最近网格线
 */
export function snapGrid(
    ptPos: Coord,
    intv: number,
    cvsWidth: number,
    cvsHeight: number,
    freeWay?: Coord,
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

    const onlyVert = freeWay && isZero(freeWay[0])
    const onlyHori = freeWay && isZero(freeWay[1])
    const a = Math.abs

    //寻找是否有足够近的竖线，如果只能上下移动（wx=0）就不找
    if (!onlyVert) {
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
    //寻找是否有足够近的横线，如果只能左右移动（wy=0）就不找
    if (!onlyHori) {
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
    const snapLines: FreeRay[] = []
    let snapX = false
    let snapY = false
    if (freeWay) {
        const [wx, wy] = freeWay
        let t = 0
        if (onlyVert) {
            t = -yDiff / wy
            snapY = yMatched
        } else if (onlyHori) {
            t = -xDiff / wx
            snapX = xMatched
        } else if (xMatched || yMatched) {
            let tx: number | undefined
            let ty: number | undefined
            if (xMatched) tx = -xDiff / wx
            if (yMatched) ty = -yDiff / wy
            if (tx !== undefined && ty !== undefined) {
                // 射线恰好穿过网格交点：横竖同时匹配
                if (isZero(tx - ty)) {
                    t = tx
                    snapX = true
                    snapY = true
                } else if (Math.abs(tx) < Math.abs(ty)) {
                    t = tx
                    snapX = true
                } else {
                    t = ty
                    snapY = true
                }
            } else if (tx !== undefined) {
                t = tx
                snapX = true
            } else {
                t = ty!
                snapY = true
            }
        }
        pos[0] += t * wx
        pos[1] += t * wy
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
    /** 自由度方向（单位向量）：后续网格吸附只能沿该方向滑动 */
    freeWay?: Coord
    snapLines: FreeRay[]
}

/** 将角度（度）归一化到 [0, 180) */
function normalizeAngleDeg(angleDeg: number): number {
    return ((angleDeg % 180) + 180) % 180
}

/** 解析角度配置字符串，支持 "30" 或 "2:3" / "2：3" 比例写法，返回角度（度） */
export function parseSnapRayAngle(s: string): number | undefined {
    const trimmed = s.trim()
    if (!trimmed) return undefined

    // 比例写法：2:3 或 2：3，表示 arctan(2/3)
    const ratioMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*[:：]\s*(\d+(?:\.\d+)?)$/)
    if (ratioMatch) {
        const a = parseFloat(ratioMatch[1])
        const b = parseFloat(ratioMatch[2])
        return Math.atan2(a, b) * 180 / Math.PI
    }

    // 包含冒号但不是有效比例格式，返回 undefined
    if (trimmed.includes(':') || trimmed.includes('：')) {
        return undefined
    }

    // 普通数字：必须整个字符串都是有效数字
    if (!/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
        return undefined
    }
    const num = parseFloat(trimmed)
    if (!isNaN(num)) return num

    return undefined
}

/** 获取角度的精确 cos/sin；对 0/45/90/135 返回精确值避免浮点误差 */
function getAngleCosSin(angleDeg: number): [number, number] {
    const a = normalizeAngleDeg(angleDeg)
    if (a === 0) return [1, 0]
    if (a === 45) return [sqrt2half, sqrt2half]
    if (a === 90) return [0, 1]
    if (a === 135) return [-sqrt2half, sqrt2half]
    const rad = a * Math.PI / 180
    return [Math.cos(rad), Math.sin(rad)]
}



/** 交点吸附允许的最大距离（相对 thrs 的倍数）：交点离 pt 超过 2*thrs 时放弃该第二射线 */
const maxCrossDistFactor = 2

/**
 * 基于邻点延长线计算吸附位置。
 * 对应原 snapStore 中 snapNeighborExtends 的核心计算。
 */
export function snapNeighborExtends(
    pt: ControlPoint,
    neighbors: ControlPoint[],
    thrs: number,
    onlySameDir: boolean,
    snapRayAngles: string[],
    snapRayAnglesForFree?: string[]
): SnapNeighborExtendsResult {
    const pos = pt.pos
    const dir = pt.dir
    const cands: { dist: number, snapTo: Coord, source: ControlPoint, angleDeg: number }[] = []

    function resolveAngles(sourcePt: ControlPoint): number[] {
        const raw = (sourcePt.free || pt.free) && snapRayAnglesForFree
            ? snapRayAnglesForFree
            : snapRayAngles
        return raw
            .map(parseSnapRayAngle)
            .filter((a): a is number => a !== undefined)
            .map(normalizeAngleDeg)
            .filter((a, i, arr) => arr.indexOf(a) === i)
    }

    neighbors.forEach(n => {
        if (onlySameDir && dir !== n.dir)
            return
        const xDiff = n.pos[0] - pos[0]
        const yDiff = n.pos[1] - pos[1]

        for (const angleDeg of resolveAngles(n)) {
            const [cos, sin] = getAngleCosSin(angleDeg)
            // 有符号垂直距离：点在直线哪一侧
            const dSigned = xDiff * sin - yDiff * cos
            const dist = Math.abs(dSigned)
            if (dist < thrs) {
                // 投影到直线上
                const snapTo: Coord = [
                    pos[0] + dSigned * sin,
                    pos[1] - dSigned * cos
                ]
                cands.push({ dist, snapTo, source: n, angleDeg })
            }
        }
    })
    cands.sort((a, b) => a.dist - b.dist)

    const snapLines: FreeRay[] = []
    if (cands.length === 0)
        return { snapLines }

    // toward：让 way 朝向吸附目标一侧，保证单向渲染的射线覆盖吸附位置
    // （如 240° 侧吸附时，way 取 60° 的反方向）
    const toRay = (c: { source: ControlPoint, angleDeg: number }, toward: Coord): FreeRay => {
        let [cos, sin] = getAngleCosSin(c.angleDeg)
        const dot = (toward[0] - c.source.pos[0]) * cos + (toward[1] - c.source.pos[1]) * sin
        if (dot < 0) {
            cos = -cos
            sin = -sin
        }
        return { source: c.source.pos, way: [cos, sin] }
    }

    const firstCand = cands[0]
    const firstCandFreeWay: Coord = getAngleCosSin(firstCand.angleDeg)
    const firstLine = toRay(firstCand, firstCand.snapTo)
    snapLines.push(firstLine)

    // 找第二条可用于求交的射线：来自不同发射源，且交点不能离 pt 太远
    // （同源射线交点恒为发射源；近平行射线交点会跑到很远，均不稳定）
    const maxCrossDistSq = (maxCrossDistFactor * thrs) ** 2
    for (let i = 1; i < cands.length; i++) {
        const c = cands[i]
        if (c.source.id === firstCand.source.id)
            continue
        const rawSecondLine = toRay(c, c.snapTo) // 朝向不影响交点计算（按无限直线处理）
        const intersection = freeRayIntersect(firstLine, rawSecondLine)
        if (!intersection)
            continue
        if (coordDistSqLessThan(intersection, pos, maxCrossDistSq)) {
            snapLines.push(toRay(c, intersection))
            return { snapRes: intersection, snapLines }
        }
    }
    return { snapRes: firstCand.snapTo, freeWay: firstCandFreeWay, snapLines }
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
