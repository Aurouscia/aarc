import { Coord } from "@/models/coord";
import {
    coordAdd,
    coordDotProduct,
    coordMut,
    makeCoordLength1
} from "@/utils/coordUtils/coordMath";
import { isZero } from "@/utils/sgn";

export interface ClusterPolyResult {
    poly: Coord[]
    area: number
}

/** 将方向 u 顺时针旋转 90°，得到其垂线方向（canvas 坐标系）。 */
function perpClockwise(u: Coord): Coord {
    return [u[1], -u[0]]
}

/**
 * 计算给定方向下的四角点（OBB）与面积。
 *
 * 方向 u 会被归一化为单位向量。对于 u 和 -u，结果相同。
 * 如果 dir 为零向量，则回退为轴对齐包围盒（等效于 u = [1, 0]）。
 */
export function clusterToPolyAngle(
    cluster: { pos: Coord }[],
    dir: Coord
): ClusterPolyResult {
    let u = makeCoordLength1(dir)
    if (isZero(coordDotProduct(u, u))) {
        u = [1, 0]
    }
    const v = perpClockwise(u)

    let aMin = Infinity
    let aMax = -Infinity
    let bMin = Infinity
    let bMax = -Infinity
    for (const p of cluster) {
        const a = coordDotProduct(p.pos, u)
        const b = coordDotProduct(p.pos, v)
        if (a < aMin) aMin = a
        if (a > aMax) aMax = a
        if (b < bMin) bMin = b
        if (b > bMax) bMax = b
    }

    if (!isFinite(aMin)) {
        // 空 cluster
        return { poly: [], area: 0 }
    }

    const c1 = coordAdd(coordMut(u, aMin), coordMut(v, bMax)) // 左上
    const c2 = coordAdd(coordMut(u, aMax), coordMut(v, bMax)) // 右上
    const c3 = coordAdd(coordMut(u, aMax), coordMut(v, bMin)) // 右下
    const c4 = coordAdd(coordMut(u, aMin), coordMut(v, bMin)) // 左下
    const area = (aMax - aMin) * (bMax - bMin)

    return { poly: [c1, c2, c3, c4], area }
}

/**
 * 从候选方向中选择面积最小的四角点。
 * 如果没有提供方向，则回退为轴对齐包围盒。
 */
export function clusterToPolyMinimumArea(
    cluster: { pos: Coord }[],
    directions: Coord[]
): ClusterPolyResult {
    if (directions.length === 0) {
        return clusterToPolyAngle(cluster, [1, 0])
    }

    let best = clusterToPolyAngle(cluster, directions[0])
    for (let i = 1; i < directions.length; i++) {
        const candidate = clusterToPolyAngle(cluster, directions[i])
        if (candidate.area < best.area) {
            best = candidate
        }
    }
    return best
}

/** 兼容旧版 vert 分支的便捷函数：返回轴对齐包围盒。 */
export function clusterToPolyVert(cluster: { pos: Coord }[]): ClusterPolyResult {
    return clusterToPolyAngle(cluster, [1, 0])
}

/** 兼容旧版 inc 分支的便捷函数：返回 45° 旋转包围盒。 */
export function clusterToPolyInc(cluster: { pos: Coord }[]): ClusterPolyResult {
    const u: Coord = [Math.SQRT1_2, Math.SQRT1_2]
    return clusterToPolyAngle(cluster, u)
}
