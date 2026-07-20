# free 点的点间吸附（snapInterPt）改造方案

## 背景

当前 `snapInterPt` 对任意目标点 `opt` 都使用固定的 4/8 方向偏置：

- `vertical` 方向：生成上下左右 4 个候选点；
- `incline` 方向或对方为 incline：再生成 4 个对角候选点。

这些偏置基于 `SgnCoord`（8 方向量化），对自由点（`free === true`）没有意义——自由点前后的区间是 **direct seg**，方向是任意的，不再是竖直/斜向网格线。继续使用 8 方向候选会导致：

- 吸附位置与自由点实际走向无关；
- 在任意角度线路附近无法自然对齐。

因此，当目标点 `opt` 为 free 点时，改用**根据其两侧实际线段方向生成 5 个候选位置**的算法。

---

## 1. 触发条件

仅在生成某个目标点 `opt` 的吸附候选时判断：

```ts
if (opt.free) {
    // 使用 5 点动态候选生成
} else {
    // 保持现有 4/8 方向逻辑
}
```

> 当前移动点 `pt` 是否为 free 不影响此分支选择；因为候选位置描述的是“相对于 `opt` 可以吸附到哪里”，只与 `opt` 自身的几何有关。若后续需要移动点为 free 时也改变行为，可再扩展。

---

## 2. 需要的数据

需要一个能拿到 `opt` 在线路上前后紧邻点的 helper，例如复用 `saveStore.adjacentSegs(opt.id)`：

```ts
interface AdjacentSeg {
    prev?: ControlPoint   // opt 前一个点
    next?: ControlPoint   // opt 后一个点
}
```

如果某侧不存在（自由点在端点），则该侧视为空。

---

## 3. 推荐算法：基于两侧线段方向的 5 点候选

### 3.1 基本设定

设自由点为 `B = opt.pos`，两侧相邻点为 `A`（prev）和 `C`（next），吸附距离为 `d`（由 `snapDists` 提供）。

定义单位方向向量：

```ts
const uBA = normalize(A.pos - B)   // 从 B 指向 A
const uBC = normalize(C.pos - B)   // 从 B 指向 C
```

`uBA` 与 `uBC` 形成 ∠ABC。内侧为夹角 < 180° 的那一侧，外侧为夹角 > 180° 的那一侧（反射角侧）。

### 3.2 计算内侧/外侧法向

对每条线段所在直线，需要一个指向内侧的单位法向量：

- 直线 AB 的内侧法向 `nAB`：垂直于 `uBA`，且满足 `nAB · uBC > 0`（指向 C 所在侧）
- 直线 BC 的内侧法向 `nBC`：垂直于 `uBC`，且满足 `nBC · uBA > 0`（指向 A 所在侧）

外侧法向即为 `-nAB` 与 `-nBC`。

具体计算（以 `nAB` 为例）：

```ts
// 任取一个垂直于 uBA 的单位向量，例如逆时针旋转 90°
const perpAB = normalize([-uBA[1], uBA[0]])

// 根据 uBC 所在侧决定符号，使 nAB 指向内侧
const nAB = dot(perpAB, uBC) > 0 ? perpAB : neg(perpAB)
```

同理计算 `nBC`。

### 3.3 生成 5 个候选点

#### 点1：B 点本身

```ts
p1 = B
```

#### 点2：内侧平行线交点

将直线 AB 与 BC 分别向内侧平移距离 `d`，取两平行线交点：

```ts
// 内侧平行线参数式
// L_AB_in: B + d * nAB + s * uBA
// L_BC_in: B + d * nBC + t * uBC

p2 = intersect(B + d * nAB, uBA, B + d * nBC, uBC)
```

#### 点3：外侧平行线交点

同理向外侧平移：

```ts
p3 = intersect(B - d * nAB, uBA, B - d * nBC, uBC)
```

#### 点4：B 到 AB 外侧平行线的垂足

```ts
p4 = B - d * nAB
```

#### 点5：B 到 BC 外侧平行线的垂足

```ts
p5 = B - d * nBC
```

### 3.4 与 snapDists 的结合

与现有逻辑一致，对每个 `snapDist`（由 `ptSnapSizes` 与 `optSnapSizes` 交叉相加得到）生成上述 5 个候选点，并计算与 `pt.pos` 的距离，取最近且小于 `snapThrs` 的作为 `matched`。

> 点2、点3 到 B 的距离会随夹角变化（约为 `d / cos(θ/2)`，其中 `θ` 为两直线夹角），它们不是简单的固定方向偏置，需要按实际几何位置直接计算。

---

## 4. 与现有 snapInterPt 的集成位置

为保持 `snapCore.ts` 的可维护性，free 点吸附逻辑单独抽到新文件 `src/utils/snapUtils/snapInterPtFree.ts` 中，核心导出：

```ts
export interface AdjacentSeg {
    prev?: ControlPoint
    next?: ControlPoint
}

export function computeFreeSnapCandidates(
    opt: ControlPoint,
    snapDist: number,
    adjacentSeg: AdjacentSeg | undefined
): Coord[]
```

`snapCore.ts` 的 `snapInterPt` 仅负责分支判断与候选距离比较。

改造后的核心循环：

```ts
for (const opt of nearbyPts) {
    const ptSnapSizes = getPtSnapSizes?.(pt.id) ?? [1]
    const optSnapSizes = getPtSnapSizes?.(opt.id) ?? [1]
    const sizesAdded = crossAddNums(ptSnapSizes, optSnapSizes).sort()
    const snapDists = sizesAdded.map(x => x / 2 * snapDistBase)
    targets.snapToPts.push(opt)

    if (opt.free) {
        snapDists.forEach(snapDist => {
            const adjacentSeg = getAdjacentSegs?.(opt.id)
            const candidates = computeFreeSnapCandidates(opt, snapDist, adjacentSeg)
            candidates.forEach(candidate => {
                // 比较 candidate 与 pt.pos，更新 matched
            })
        })
    } else {
        const biases = computeStandardBiases(pt, opt, noBias)
        snapDists.forEach(snapDist => {
            biases.forEach(b => {
                const biased = applyBiasFree(opt.pos, b, snapDist)
                // 比较 biased 与 pt.pos
            })
        })
    }
}
```

其中：
- `computeFreeSnapCandidates` 定义在 `snapInterPtFree.ts`，直接返回 5 个绝对坐标候选点；
- `computeStandardBiases` 定义在 `snapCore.ts`，把现有 4/8 方向逻辑抽出来，返回归一化后的 `Coord[]`；
- 非 free 分支统一改用 `applyBiasFree`，对角向量归一化后无需 `sqrt2half` 修正。

`snapStore.ts` 需要在调用 `snapInterPtCore` 时传入 `getAdjacentSegs`，从 `saveStore.adjacentSegs(id)` 转换得到 `AdjacentSeg`：

```ts
const getAdjacentSegs = (id: number): AdjacentSeg | undefined => {
    const segs = saveStore.adjacentSegs(id)
    const first = segs[0]
    if (!first) return undefined
    const idx = first.pts.findIndex(p => p.id === id)
    if (idx === -1) return undefined
    return {
        prev: first.pts[idx - 1],
        next: first.pts[idx + 1]
    }
}
```

---

## 5. 边界情况处理

| 场景 | 处理 |
|------|------|
| 两侧都存在（一般情况） | 按第 3 节生成完整 5 点。 |
| 两侧线段共线 | 内侧/外侧概念退化，取垂直于共线方向的 `side = perp(uBC)`，生成 B、B ± d * side 共 3 个候选。 |
| 两侧线段反向（U 形折回） | 视为夹角接近 180°，按共线退化处理，避免零向量。 |
| 端点自由点（只有一侧） | 以该侧线段方向为轴，生成 B、B ± d * perp(u) 共 3 个候选；沿轴向的延长点可视需求追加。 |
| 孤立自由点 | 只返回 `[B]` 候选。 |
| 线段极短 | 若 `|segment| < ε`，跳过该侧，用另一侧；两侧都极短则退化到孤立点。 |
| 点在多条线路中重复出现 | `adjacentSegs` 可能只返回第一次出现的位置；若需更精确，可对每个出现位置分别生成候选并去重。 |

---

## 6. 可视化效果预期

- 非 free 点：仍吸附到上下左右/对角 8 个位置，与现在一致。
- free 点：吸附候选会“贴”在其实际走向上。
  - 钝角拐角上的 free 点：候选呈“角平分线内侧/外侧交点 + 两垂足”分布，符合视觉直觉。
  - 直线段上的 free 点：退化为沿线垂向的 3 个候选。
  - 端点 free 点：退化为以线段为轴的 3 个候选。

---

## 7. 测试建议

1. **几何正确性**：给定 `A(0,0)`、`B(1,0)`、`C(3,1)`、`d = 0.1`，验证：
   - 点1 = (1, 0)
   - 点2 ≈ (0.976, 0.1)
   - 点3 ≈ (1.024, -0.1)
   - 点4 = (1, -0.1)
   - 点5 ≈ (1.045, -0.089)
2. **退化情况**：
   - 共线：验证只生成 B 与两个垂向点。
   - 端点：验证只使用单侧方向。
   - 孤立点：验证只有 B。
3. **集成测试**：构造一个含 free 点的任意角度线路，移动另一个点靠近它，观察吸附位置是否沿实际走向。
4. **回归测试**：非 free 点的 8 方向吸附结果必须与改造前完全一致。

---

## 8. 实现状态

本方案已实现：

- `src/utils/snapUtils/snapInterPtFree.ts`：新增 `computeFreeSnapCandidates`，负责 5 点候选生成及退化处理。
- `src/utils/snapUtils/snapCore.ts`：`snapInterPt` 内按 `opt.free` 分支；free 点调用 `computeFreeSnapCandidates`，非 free 点保持原有 4/8 方向逻辑（抽离为 `computeStandardBiases`）。
- `src/models/stores/snapStore.ts`：在调用 `snapInterPtCore` 时传入 `getAdjacentSegs`，从 `saveStore.adjacentSegs` 转换得到 `AdjacentSeg`。

后续可按第 7 节进行测试验证。
