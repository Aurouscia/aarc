import { FormalPt } from "@/models/coord";
import { FlatSpan } from "@/models/stores/saveDerived/lineSpanStore";

/**
 * 从整线 FormalPt[] 中截取指定 span 对应的子集
 * 
 * afterIdxEqv 含义：
 * - 控制点本身：等于该点在 pts 中的索引
 * - 插值点：等于所在区间的前一个控制点索引
 * 
 * 例如 pts=[A,B,C], formalPts=[A, itp1, itp2, B, itp3, C]
 * afterIdxEqv: [0, 0, 0, 1, 1, 2]
 * 
 * span fromIdx=0, toIdx=1 (A→B): 结果 [A, itp1, itp2, B]
 */
export function extractSpanFormalPts(allFormalPts: FormalPt[], span: FlatSpan): FormalPt[] {
    const startIdx = allFormalPts.findIndex(
        (fp: FormalPt) => fp.afterIdxEqv === span.fromIdx
    )
    // 找到第一个 afterIdxEqv === span.toIdx 的点（即 seg[toIdx-1].b，终点本身）
    // 注意：seg[k].b 的 afterIdxEqv = k+1，所以它总是 afterIdxEqv === k+1 的第一个点
    // （因为 seg[k].itp 的 afterIdxEqv = k，在 seg[k].b 之前）
    const endIdx = allFormalPts.findIndex(
        (fp: FormalPt) => fp.afterIdxEqv === span.toIdx
    )
    if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
        return []
    }
    return allFormalPts.slice(startIdx, endIdx + 1)
}
