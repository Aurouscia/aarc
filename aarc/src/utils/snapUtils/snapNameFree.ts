import { Coord } from "@/models/coord";
import { coordDotProduct, coordInv, coordMut } from "@/utils/coordUtils/coordMath";

/** 逆时针旋转 90° 得到法向（输入为单位向量时输出也是单位向量） */
function perpCCW(u: Coord): Coord {
    return [-u[1], u[0]]
}

/**
 * 由 free 点的方向集合生成站名吸附候选（相对站心的偏移）。
 * 每个方向贡献 ±法向共 2 个候选；dirs 为空时返回 []。
 *
 * @param dirs free 点的线路方向集合（PtDirectionInfo.all，已去重并归一化到 [0, π)）
 * @param snd 吸附距离（snapOctaClingPtNameDist × distRatio）
 */
export function computeFreeNameSnapCandidates(dirs: Coord[], snd: number): Coord[] {
    const res: Coord[] = []
    for (const u of dirs) {
        const n = perpCCW(u)
        res.push(coordMut(n, snd), coordMut(coordInv(n), snd))
    }
    return res
}

/**
 * 求 nameP 到最近法向直线的投影。
 * 法向直线 = 过原点、方向为 perp(u) 的直线；nameP 到它的有符号距离 = dot(nameP, u)。
 * 多个方向时取距离最小者；dirs 为空时返回 undefined。
 */
export function projectToNearestNormalLine(
    nameP: Coord,
    dirs: Coord[]
): { distAbs: number, proj: Coord } | undefined {
    let best: { distAbs: number, proj: Coord } | undefined
    for (const u of dirs) {
        const dSigned = coordDotProduct(nameP, u)
        const distAbs = Math.abs(dSigned)
        if (best && distAbs >= best.distAbs)
            continue
        best = {
            distAbs,
            proj: [nameP[0] - u[0] * dSigned, nameP[1] - u[1] * dSigned]
        }
    }
    return best
}
