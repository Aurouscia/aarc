import { ControlPoint, ControlPointDir } from "@/models/save";
import { Coord, FormalPt, FormalRay, twinPts2Ray } from "@/models/coord";
import { coordRelDiff } from "@/utils/coordUtils/coordRel";
import { coordFill } from "@/utils/coordUtils/coordFill";
import { isRing } from "@/utils/lineUtils/isRing";
import { rayIntersect } from "@/utils/rayUtils/rayIntersection";
import { rayPerpendicular } from "@/utils/rayUtils/rayParallel";
import { rayRotate90 } from "@/utils/rayUtils/rayRotate";
import { rayToCoordDist } from "@/utils/rayUtils/rayToCoordDist";
import { numberCmpEpsilon } from "@/utils/consts";

export interface FormalSeg {
    a: Coord
    itp: Coord[]
    b: Coord
    ill: number
}

/**
 * 将数据中的控制点序列转换为“formal点”序列。
 *
 * formal点是绘制线路时实际使用的点，它会在相邻控制点之间插入必要的中间点，
 * 使得线路能够按控制点方向（vertical/incline）和相对位置形成规则的折线/曲线。
 *
 * 每个 formalPt 带有 afterIdxEqv，表示它对应于原控制点序列中第几个“段之后”
 * （等价于该点位于原控制点 i 与 i+1 之间的那段上，或恰好是第 i 个控制点）。
 * 例如 pts=[A,B,C] 时，formalPts 的 afterIdxEqv 可能为 [0,0,0,1,1,2]。
 */
export function formalize(pts: ControlPoint[], idxOffset = 0): FormalPt[] {
    if (pts.length < 2)
        return [];
    const isRingLine = isRing(pts)
    const formalSegs: FormalSeg[] = []
    if (!isRingLine) {
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i]
            const b = pts[i + 1]
            const seg = formalizeSeg(a, b)
            formalSegs.push(seg)
        }
    } else {
        const a = pts[pts.length - 2]
        const b = pts[0]
        const headMarginSeg = formalizeSeg(a, b)
        formalSegs.push(headMarginSeg)
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i]
            const b = pts[i + 1]
            const seg = formalizeSeg(a, b)
            formalSegs.push(seg)
        }
        const c = pts[pts.length - 1]
        const d = pts[1]
        const tailMarginSeg = formalizeSeg(c, d)
        formalSegs.push(tailMarginSeg)
    }
    //辅助矫正
    illPosedSegJustify(formalSegs)
    if (formalSegs.length == 0)
        return []
    if (isRingLine) {
        formalSegs.shift()
        formalSegs.pop()
    }
    const formalPts: FormalPt[] = []
    formalPts.push({ pos: formalSegs[0].a, afterIdxEqv: 0 + idxOffset })
    for (let i = 0; i < formalSegs.length; i++) {
        const seg = formalSegs[i]
        seg.itp.forEach(p => formalPts.push({ pos: p, afterIdxEqv: i + idxOffset }))
        formalPts.push({ pos: seg.b, afterIdxEqv: i + 1 + idxOffset })
    }
    return formalPts
}

export function formalizeSeg(a: ControlPoint, b: ControlPoint): FormalSeg {
    let xDiff = a.pos[0] - b.pos[0]
    let yDiff = a.pos[1] - b.pos[1]
    const rel = coordRelDiff(xDiff, yDiff)
    const pr = rel.posRel
    const rv = rel.rev;
    if (pr == 's')
        return { a: a.pos, itp: [], b: b.pos, ill: 0 };
    const originalA = a;
    const originalB = b;
    if (rel.rev) {
        const temp = a;
        a = b;
        b = temp;
        xDiff = -xDiff
        yDiff = -yDiff
    }
    let itp: Coord[]
    let ill = 0;
    if (a.dir === b.dir) {
        if (a.dir == ControlPointDir.incline) {
            itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'midVert')
        } else {
            itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'midInc')
        }

        if (itp.length == 0) {
            if (a.dir == ControlPointDir.vertical && (pr == 'lu' || pr == 'ur')
                || a.dir == ControlPointDir.incline && (pr == 'l' || pr == 'u')) {
                ill = 2     //×-×
            } else {
                ill = 0     //+-+
            }
        } else {
            ill = 1
        }
    }
    else if (a.dir == ControlPointDir.incline) {
        if (pr == 'luu' || pr == 'uur') {
            itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'top')
        } else {
            itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'bottom')
        }
    } else {
        if (pr == 'luu' || pr == 'uur') {
            itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'bottom')
        } else {
            itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'top')
        }
    }
    return { a: originalA.pos, b: originalB.pos, itp, ill }
}

export function illPosedSegJustify(segs: FormalSeg[]) {
    if (segs.length <= 1)
        return;

    const illIdxs: number[] = []
    for (let i = 0; i < segs.length; i++) {
        if (segs[i].ill)
            illIdxs.push(i)
    }
    illIdxs.forEach(i => {
        const thisSeg = segs[i]
        if (i > 0 && i < segs.length - 1) {
            //如果是中间段，让前后两段矫正它
            const prevSeg = segs[i - 1]
            const nextSeg = segs[i + 1]
            const prevHelps = prevSeg.ill < thisSeg.ill
            const nextHelps = nextSeg.ill < thisSeg.ill
            if (prevHelps && nextHelps) {
                const prevRef = prevSeg.itp.length == 0 ? prevSeg.a : prevSeg.itp[prevSeg.itp.length - 1]
                const prevRay = twinPts2Ray(prevRef, prevSeg.b)
                const nextRef = nextSeg.itp.length == 0 ? nextSeg.b : nextSeg.itp[0]
                const nextRay = twinPts2Ray(nextRef, nextSeg.a)
                const itsc = rayIntersect(prevRay, nextRay, true)
                if (itsc)
                    thisSeg.itp = [itsc]
            }
        }
        else {
            //如果是末端，让最近的一段矫正它
            const func = (neibRef: Coord, share: Coord, thisRef: Coord | null, thisTip: Coord) => {
                const neibRay = twinPts2Ray(neibRef, share)
                let thisRay: FormalRay;
                if (!thisRef) {
                    //若区间内只有尖端一个点
                    if (rayToCoordDist(neibRay, thisTip) < numberCmpEpsilon) {
                        //若尖端本就在邻近区间延长线的垂线上，什么都不做
                        return
                    }
                    //尖端到邻近区间延长线的垂线，返回垂线交点
                    thisRay = { source: thisTip, way: [...neibRay.way] }
                    rayRotate90(thisRay)
                    return rayIntersect(neibRay, thisRay, true)
                } else {
                    //若本区间有尖端外其他点，且尖端到该点延长线与邻近区间延长线垂直，返回交点
                    thisRay = twinPts2Ray(thisRef, share)
                    thisRay.source = thisTip
                    if (rayPerpendicular(neibRay, thisRay)) {
                        return rayIntersect(neibRay, thisRay, true)
                    }
                }
            }
            let itsc: Coord | undefined
            if (i == segs.length - 1) {
                const prevSeg = segs[i - 1]
                const canHelp = prevSeg.ill <= thisSeg.ill && prevSeg.ill < 2
                const needHelp = thisSeg.ill > 0
                if (needHelp && canHelp) {
                    const neibRef = prevSeg.itp.length == 0 ? prevSeg.a : prevSeg.itp[prevSeg.itp.length - 1]
                    const share = thisSeg.a
                    const thisRef = thisSeg.itp.length > 1 ? thisSeg.itp[0] : null
                    const thisTip = thisSeg.b
                    itsc = func(neibRef, share, thisRef, thisTip)
                }
            } else if (i == 0) {
                const nextSeg = segs[i + 1]
                const canHelp = nextSeg.ill <= thisSeg.ill && nextSeg.ill < 2
                const needHelp = thisSeg.ill > 0
                if (canHelp && needHelp) {
                    const neibRef = nextSeg.itp.length == 0 ? nextSeg.b : nextSeg.itp[0]
                    const share = thisSeg.b
                    const thisRef = thisSeg.itp.length > 1 ? thisSeg.itp[1] : null
                    const thisTip = thisSeg.a
                    itsc = func(neibRef, share, thisRef, thisTip)
                }
            }
            if (itsc) {
                thisSeg.itp = [itsc]
            }
        }
    })
}
