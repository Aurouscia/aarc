import { Save, Line, LineSliceBase } from "@/models/save";
import { indicesInArray } from "@/utils/lang/indicesInArray";

/**
 * 矫正 Slice 端点，确保符合 fromIdx < toIdx 的约定。
 *
 * ## "反了"的判断逻辑
 *
 * 对于非奇异点（在线路中只出现一次），直接用 indexOf 判断即可。
 *
 * 对于奇异点（在线路中出现多次），不能简单用 indexOf（只会返回第一次出现）。
 * 此时需要结合解析规则来判断：
 *
 * - from 非奇异、to 奇异：to 应该位于 from 的右侧（to 向右找最近的 from）
 *   → 如果 to 的所有出现位置都在 from 左侧，说明"反了"
 *
 * - from 奇异、to 非奇异：from 应该位于 to 的左侧（from 向左找最近的 to）
 *   → 如果 from 的所有出现位置都在 to 右侧，说明"反了"
 *
 * - 双方非奇异：直接比较 indexOf
 *
 * - 双方奇异：不处理（此类 slice 本身就不应存在）
 *
 * ## 交换策略
 * 交换 fromPt 和 toPt，让解析后的 fromIdx < toIdx。
 * 对于奇异点，交换后由解析规则自然找到正确位置。
 */
export function ensureValidSliceEndpoints(save: Save) {
    const lineMap = new Map<number, Line>();
    for (const line of save.lines) {
        lineMap.set(line.id, line);
    }

    if (save.timeSlices) {
        for (const slice of save.timeSlices) {
            fixSliceIfReversed(slice, lineMap);
        }
    }

    if (save.styleSlices) {
        for (const slice of save.styleSlices) {
            fixSliceIfReversed(slice, lineMap);
        }
    }
}

function fixSliceIfReversed(
    slice: LineSliceBase,
    lineMap: Map<number, Line>
) {
    const line = lineMap.get(slice.line);
    if (!line) return;

    const pts = line.pts;
    const fromIndices = indicesInArray(pts, slice.fromPt);
    const toIndices = indicesInArray(pts, slice.toPt);

    // 点不存在于线路中，无法判断
    if (fromIndices.length === 0 || toIndices.length === 0) return;

    const fromSingular = fromIndices.length > 1;
    const toSingular = toIndices.length > 1;

    // 双方奇异：不处理（此类 slice 本身就不应存在）
    if (fromSingular && toSingular) return;

    let isReversed = false;

    if (!fromSingular && !toSingular) {
        // 都非奇异：直接比较
        const fromIdx = fromIndices[0];
        const toIdx = toIndices[0];
        isReversed = fromIdx > toIdx;
    } else if (!fromSingular && toSingular) {
        // from 非奇异，to 奇异
        // 正常情况：to 应该位于 from 的右侧（to 向右找最近的 from）
        const fromIdx = fromIndices[0];
        // to 的所有出现位置都在 from 左侧 → 反了
        const allToOnLeft = toIndices.every((idx) => idx < fromIdx);
        isReversed = allToOnLeft;
    } else {
        // from 奇异，to 非奇异
        // 正常情况：from 应该位于 to 的左侧（from 向左找最近的 to）
        const toIdx = toIndices[0];
        // from 的所有出现位置都在 to 右侧 → 反了
        const allFromOnRight = fromIndices.every((idx) => idx > toIdx);
        isReversed = allFromOnRight;
    }

    if (isReversed) {
        console.warn(`[规范化]已交换slice(${slice.id})的fromPt和toPt，原fromPt=${slice.toPt}，原toPt=${slice.fromPt}`)
        const tmp = slice.fromPt;
        slice.fromPt = slice.toPt;
        slice.toPt = tmp;
    }
}
