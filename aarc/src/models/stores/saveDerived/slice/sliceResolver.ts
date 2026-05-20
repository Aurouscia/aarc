import { Line } from "../../../save";

/**
 * Slice 端点解析器
 *
 * 将 `LineSliceBase` 中存储的点ID（fromPt/toPt）解析为线路点序列中的确定索引。
 *
 * ## 核心约定
 * 1. **方向**：fromIdx < toIdx（from 在 to 前面）。若创建时选反，自动交换。
 * 2. **禁止同点**：fromPt === toPt 的片段不允许存在。
 * 3. **禁止双奇异**：from 和 to 不能同时为奇异点。
 *    - 奇异点 = 在该线路 pts 中出现次数 > 1 的点
 *    - 用户需通过多段拼接处理此类场景
 *
 * ## 奇异点解析规则
 * 当且仅当一端为奇异点时，非奇异端固定，奇异端按方向寻找最近的匹配：
 *
 * | from | to | 行为 |
 * |------|-----|------|
 * | 非奇异 | 非奇异 | 直接 indexOf，无歧义 |
 * | 非奇异 | 奇异 | to 向右（索引增加）找最近的 from |
 * | 奇异 | 非奇异 | from 向左（索引减少）找最近的 to |
 * | 奇异 | 奇异 | ❌ 禁止，返回 undefined |
 *
 * "最近"定义为索引之差的绝对值最小。
 *
 * ## 稳定性保证
 * 以下操作**不会**改变已解析的片段范围：
 * - 在片段范围外插入/删除任意点
 * - 在片段范围外新增/消除奇异点
 *
 * 以下操作**会**改变片段范围：
 * - 在 from/to 之间插入/删除点（范围伸缩，预期行为）
 * - 在 from/to 之间新增/消除奇异点（罕见，需用户手动修正）
 */

/**
 * 判断某点在线路中是否为奇异点（出现次数 > 1）
 */
function isSingular(line: Line, ptId: number): boolean {
    let count = 0;
    for (const p of line.pts) {
        if (p === ptId) {
            count++;
            if (count > 1) return true;
        }
    }
    return false;
}

/**
 * 从 startIdx 开始向右（索引增加方向）寻找 targetPt 的最近出现位置
 * @returns 找到的索引，若未找到则返回 -1
 */
function findNearestRight(line: Line, startIdx: number, targetPt: number): number {
    const pts = line.pts;
    let nearestIdx = -1;
    let minDist = Infinity;
    for (let i = startIdx; i < pts.length; i++) {
        if (pts[i] === targetPt) {
            const dist = i - startIdx;
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = i;
            }
        }
    }
    return nearestIdx;
}

/**
 * 从 startIdx 开始向左（索引减少方向）寻找 targetPt 的最近出现位置
 * @returns 找到的索引，若未找到则返回 -1
 */
function findNearestLeft(line: Line, startIdx: number, targetPt: number): number {
    const pts = line.pts;
    let nearestIdx = -1;
    let minDist = Infinity;
    for (let i = startIdx; i >= 0; i--) {
        if (pts[i] === targetPt) {
            const dist = startIdx - i;
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = i;
            }
        }
    }
    return nearestIdx;
}

/**
 * 解析 Slice 端点，返回确定的索引位置。
 *
 * @param line 所属线路
 * @param fromPt 起始点ID
 * @param toPt 结束点ID
 * @returns 解析后的 {fromIdx, toIdx}，若违反规则则返回 undefined
 */
export function resolveSliceEndpoints(
    line: Line,
    fromPt: number,
    toPt: number
): { fromIdx: number; toIdx: number } | undefined {
    const pts = line.pts;

    // 规则2：禁止同点
    if (fromPt === toPt) {
        return undefined;
    }

    const fromSingular = isSingular(line, fromPt);
    const toSingular = isSingular(line, toPt);

    // 规则3：禁止双奇异
    if (fromSingular && toSingular) {
        return undefined;
    }

    let fromIdx: number;
    let toIdx: number;

    if (!fromSingular && !toSingular) {
        // 都非奇异：直接 indexOf
        fromIdx = pts.indexOf(fromPt);
        toIdx = pts.indexOf(toPt);
    } else if (fromSingular && !toSingular) {
        // from 奇异，to 非奇异：from 向左找最近的 to
        toIdx = pts.indexOf(toPt);
        fromIdx = findNearestLeft(line, toIdx, fromPt);
    } else {
        // from 非奇异，to 奇异：to 向右找最近的 from
        fromIdx = pts.indexOf(fromPt);
        toIdx = findNearestRight(line, fromIdx, toPt);
    }

    if (fromIdx === -1 || toIdx === -1) {
        return undefined;
    }

    // 规则1：确保 fromIdx < toIdx
    if (fromIdx > toIdx) {
        [fromIdx, toIdx] = [toIdx, fromIdx];
    }

    return { fromIdx, toIdx };
}
