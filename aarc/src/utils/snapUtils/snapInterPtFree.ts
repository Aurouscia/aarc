import { Coord, FreeRay } from "@/models/coord";
import { ControlPoint } from "@/models/save";
import {
    coordAdd,
    coordMut,
    coordInv,
    coordDotProduct,
    coordCrossProduct,
    makeCoordLength1
} from "@/utils/coordUtils/coordMath";
import { freeRayIntersect } from "@/utils/rayUtils/rayIntersection";
import { isZero } from "@/utils/sgn";
import { PtDirectionInfo } from "@/utils/ptUtils/ptDirection";

export type { PtDirectionInfo } from "@/utils/ptUtils/ptDirection";

/** 逆时针旋转 90° */
function perpCCW(v: Coord): Coord {
    return [-v[1], v[0]]
}

/** 构造射线 */
function ray(source: Coord, way: Coord): FreeRay {
    return { source, way }
}

/**
 * 计算直线的单位内法向。
 * @param lineDir 直线方向（单位向量）
 * @param towards 指向内侧的参考方向（单位向量）
 * @returns 垂直于 lineDir 的单位向量，指向 towards 所在半平面
 */
function innerNormal(lineDir: Coord, towards: Coord): Coord {
    const perp = perpCCW(lineDir)
    const len = Math.hypot(perp[0], perp[1])
    const unitPerp: Coord = [perp[0] / len, perp[1] / len]
    return coordDotProduct(unitPerp, towards) >= 0 ? unitPerp : coordInv(unitPerp)
}

/**
 * 生成 free 点的点间吸附候选位置（5 点方案）。
 *
 * @param opt 目标 free 点
 * @param snapDist 吸附距离
 * @param directionInfo 由 freePtDirectionStore 提供的方向信息；若为 undefined 则视为孤立点
 * @returns 候选位置数组，按 [B, 内侧交点, 外侧交点, AB 外侧垂足, BC 外侧垂足] 顺序
 */
export function computeFreeSnapCandidates(
    opt: ControlPoint,
    snapDist: number,
    directionInfo: PtDirectionInfo | undefined
): Coord[] {
    const B = opt.pos

    const prev = directionInfo?.prev
    const next = directionInfo?.next
    const hasPrev = prev !== undefined
    const hasNext = next !== undefined

    // 孤立点：只返回 B 本身
    if (!hasPrev && !hasNext) {
        return [[...B] as Coord]
    }

    const uBA = prev?.dir
    const uBC = next?.dir

    // 端点退化：只有单侧，生成 B + 两个垂向点
    if (!hasPrev || !hasNext) {
        const u = (uBC ?? uBA)!
        const side = makeCoordLength1(perpCCW(u))
        const d = snapDist
        return [
            [...B] as Coord,
            coordAdd(B, coordMut(side, d)),
            coordAdd(B, coordMut(coordInv(side), d))
        ]
    }

    // 两侧都存在：检查是否共线或反向（cross ≈ 0）
    const cross = coordCrossProduct(uBA!, uBC!)
    if (isZero(cross)) {
        const u = uBC!
        const side = makeCoordLength1(perpCCW(u))
        const d = snapDist
        return [
            [...B] as Coord,
            coordAdd(B, coordMut(side, d)),
            coordAdd(B, coordMut(coordInv(side), d))
        ]
    }

    // 一般情况
    const d = snapDist
    const nAB = innerNormal(uBA!, uBC!)  // AB 的内侧法向
    const nBC = innerNormal(uBC!, uBA!)  // BC 的内侧法向

    // 点1：B 本身
    const p1: Coord = [...B] as Coord

    // 点2：内侧平行线交点
    const p2 = freeRayIntersect(
        ray(coordAdd(B, coordMut(nAB, d)), uBA!),
        ray(coordAdd(B, coordMut(nBC, d)), uBC!)
    ) ?? p1

    // 点3：外侧平行线交点
    const p3 = freeRayIntersect(
        ray(coordAdd(B, coordMut(coordInv(nAB), d)), uBA!),
        ray(coordAdd(B, coordMut(coordInv(nBC), d)), uBC!)
    ) ?? p1

    // 点4：B 到 AB 外侧平行线的垂足
    const p4 = coordAdd(B, coordMut(coordInv(nAB), d))

    // 点5：B 到 BC 外侧平行线的垂足
    const p5 = coordAdd(B, coordMut(coordInv(nBC), d))

    return [p1, p2, p3, p4, p5]
}

