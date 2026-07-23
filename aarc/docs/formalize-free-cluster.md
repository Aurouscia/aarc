# free 点的车站团（cluster）四角点改造方案

## 背景

当前 `clusterCvsWorker` 绘制车站团（cluster）时，根据团内点的 `dir` 属性只考虑两种固定方向：

- `vertical`：使用轴对齐包围盒（`clusterToPolyVert`）
- `incline`：使用 45° 旋转包围盒（`clusterToPolyInc`）
- 混合时：分别计算两者，取面积较小者

对于 free 点，其前后区间是 direct seg，方向可以是任意角度。上述两种固定方向的四角点（矩形）无法紧密贴合实际走向，会出现：

- 自由斜线段附近的车站团被画成胖胖的轴对齐/45° 矩形。
- 多个 free 点组成的车站团四角点与实际线路方向不一致。

参考 `aarc/docs/formalize-free-snap-interpt.md` 的思路：free 点的几何应由其两侧实际线段方向决定，而非 8 方向量化。因此，当 cluster 包含 free 点时，需要改用基于邻点方向的方向集合，并选择四角点面积最小的方向作为实际绘制。

## 1. 目标

- 对包含 free 点的 cluster，根据每个点的邻点位置计算其“方向”。
- 在 cluster 内尝试多种方向，选择四角点面积最小的方向作为实际绘制。
- 将“任意角度四角点”逻辑独立为可测试的文件。
- 对“计算点方向”进行性能优化，使用 computed 缓存。
- 不破坏非 free 点的现有 cluster 绘制行为。

## 2. 术语

- **点方向（pt direction）**：点所在相邻线段的单位方向向量。一个点可能有多个方向（如拐角、多条线路经过）。
- **候选方向**：cluster 内所有点方向的集合，经过去重后用于尝试绘制。
- **有向包围盒（OBB）**：给定方向下的最小矩形，边平行/垂直于该方向。
- **四角点**：OBB 的四个顶点，按顺时针顺序组成 polygon。

## 3. 当前 cluster 四角点逻辑回顾

在 `src/models/cvs/workers/clusterCvsWorker.ts` 中：

```ts
function clustersToPolys(clusters: ControlPoint[][], asIs?: 'asIs'): ClusterPoly[] {
    // ...
    if (asIs) {
        poly = c.map(x => x.pos)
    } else {
        const vertCount = c.filter(x => x.dir === ControlPointDir.vertical).length
        const incCount = c.filter(x => x.dir === ControlPointDir.incline).length
        if (incCount === 0) {
            poly = clusterToPolyVert(c).poly
        } else if (vertCount === 0) {
            poly = clusterToPolyInc(c).poly
        } else {
            const polyVert = clusterToPolyVert(c)
            const polyInc = clusterToPolyInc(c)
            poly = polyInc.area < polyVert.area ? polyInc.poly : polyVert.poly
        }
    }
    // ...
}
```

`clusterToPolyVert` 和 `clusterToPolyInc` 都是特殊角度的 OBB 实现。改造的核心是把它们推广为任意角度，并增加 free 点特有的方向选择逻辑。

## 4. 推荐算法

### 4.1 计算点的方向（由 `useFreePtDirectionStore` 统一提供）

一个点的方向由其在线路中的前后邻点决定。当前 `snapStore.ts` 已经通过 `getAdjacentSegs` 把 `saveStore.adjacentSegs(ptId)` 转换成 `AdjacentSeg` 并传给 `snapInterPtFree.ts`，`snapInterPtFree.ts` 内部又根据 `AdjacentSeg` 计算 `uBA`、`uBC` 两个方向。

如果 cluster 再独立实现一套同样的转换和方向计算，会造成重复。因此建议把**“free 点方向/相邻段”**提取到一个新的 derived store 中，供 snap 和 cluster 共享。

复用 `saveStore.adjacentSegs(ptId)`：

```ts
interface AdjacentSeg {
    prev?: ControlPoint
    next?: ControlPoint
}
```

对某个点的一次出现（即 `adjacentSegs` 返回的一个 `LineSeg`），按以下规则生成方向：

| 相邻情况 | 处理 |
|----------|------|
| 两侧都存在 | 若 `prev`、`pt`、`next` 共线，产生 1 个方向 `normalize(pt.pos - prev.pos)`；否则产生 2 个方向：`normalize(pt.pos - prev.pos)` 与 `normalize(next.pos - pt.pos)`。 |
| 只有单侧 | 产生 1 个方向。 |
| 孤立点 | 无方向。 |
| 线段长度极短 | 若 `|segment| < ε`，跳过该侧，避免退化方向。 |

一个点可能出现在多条线路中，因此可能产生多于 2 个方向。`useFreePtDirectionStore` 仅对 `free === true` 的点进行缓存，同时提供**第一次出现**的 `AdjacentSeg`（供 snap 使用）和**所有方向**（供 cluster 使用）。非 free 点的方向由 `ControlPointDir` 覆盖，不进入此 store。

**注意**：这里取的是“点指向邻点”的向量，而不是“邻点指向点”。对于包围盒方向来说，`u` 与 `-u` 等价（同一条直线），后续会归一化到 `[0, π)` 区间。

### 4.2 生成候选方向

对 cluster 内所有点调用上述方向计算，收集所有方向后：

1. 归一化到单位向量。
2. 将方向映射到 `[0, π)` 区间（例如用 `atan2`，并保证 `u` 与 `-u` 落在同一角度）。
3. 按角度去重（容差 `numberCmpEpsilon` 量级）。

> 仅当 cluster 包含 free 点时才需要此步骤。非 free 点的 cluster 保持现有 `vert/inc` 二选一逻辑。

### 4.3 计算某个方向下的四角点

给定单位方向 `u` 和垂线方向 `v = perpClockwise(u)`（即 `[u[0], -u[1]]` 的旋转，对应 canvas 坐标系下的顺时针）：

对每个点 `p` 计算：

```ts
const a = coordDotProduct(p.pos, u)
const b = coordDotProduct(p.pos, v)
```

取 `aMin, aMax, bMin, bMax`，四个角点：

```ts
const c1 = coordAdd(coordMut(u, aMin), coordMut(v, bMax)) // 对应 clusterToPolyInc 中的 t
const c2 = coordAdd(coordMut(u, aMax), coordMut(v, bMax)) // 对应 r
const c3 = coordAdd(coordMut(u, aMax), coordMut(v, bMin)) // 对应 b
const c4 = coordAdd(coordMut(u, aMin), coordMut(v, bMin)) // 对应 l
```

面积：

```ts
const area = (aMax - aMin) * (bMax - bMin)
```

**等价性验证**：

- 当 `u = [1, 0]`，`v = [0, -1]` 时，结果与 `clusterToPolyVert` 一致（仅顶点顺序不同，polygon 相同）。
- 当 `u = [sqrt2half, sqrt2half]`，`v = [sqrt2half, -sqrt2half]` 时，结果与 `clusterToPolyInc` 一致。

因此新函数可以完整替代 `clusterToPolyVert` 和 `clusterToPolyInc`（可选，本计划暂不改动非 free 分支）。

### 4.4 选择最小面积方向

```ts
let best = clusterToPolyVert(c) // 默认回退
for (const dir of candidateDirections) {
    const candidate = clusterToPolyAngle(c, dir)
    if (candidate.area < best.area) {
        best = candidate
    }
}
poly = best.poly
```

如果 cluster 没有方向（例如孤立点），直接回退到 `clusterToPolyVert`。

## 5. 文件结构

> 注意：`clusterToPolyVert`/`clusterToPolyInc` 的原有内部实现已被移除，`clusterCvsWorker` 统一使用 `clusterPolyAngle` 提供的函数。新函数对 0°/45° 等价，但 45° 的顶点顺序为 `[t,r,b,l]`，与旧内部实现的 `[t,l,b,r]` 不同；由于渲染使用 `closePath`，顺序差异不影响显示。

### 5.1 新增 `src/utils/ptUtils/ptDirection.ts`（已完成）

纯函数方向计算，`snap` 和 `cluster` 共享。

```ts
export interface AdjacentSeg {
    prev?: { pos: Coord }
    next?: { pos: Coord }
}

export function computePtDirectionInfo(
    pos: Coord,
    adjacentSeg: AdjacentSeg | undefined
): PtDirectionInfo

export function computePtDirections(
    pos: Coord,
    adjacentSeg: AdjacentSeg | undefined
): Coord[]
```

### 5.2 新增 `src/models/stores/saveDerived/freePtDirectionStore.ts`（已完成）

统一缓存 free 点的相邻段与方向，供 `snapStore`、`clusterCvsWorker` 使用。

```ts
export const useFreePtDirectionStore = defineStore('freePtDirection', () => {
    // ... computed 缓存 ...
    function getAdjacentSeg(ptId: number): AdjacentSeg | undefined
    function getPtDirectionInfo(ptId: number): PtDirectionInfo | undefined
    function getPtDirections(ptId: number): Coord[]
    return { getAdjacentSeg, getPtDirectionInfo, getPtDirections }
})
```

### 5.3 新增 `src/utils/clusterUtils/clusterPolyAngle.ts`（已完成）

负责任意角度四角点计算，核心导出：

```ts
export interface ClusterPolyResult {
    poly: Coord[]
    area: number
}

/** 计算给定方向 u 下的四角点与面积 */
export function clusterToPolyAngle(
    cluster: { pos: Coord }[],
    dir: Coord
): ClusterPolyResult

/** 从候选方向中选择面积最小的四角点 */
export function clusterToPolyMinimumArea(
    cluster: { pos: Coord }[],
    directions: Coord[]
): ClusterPolyResult

/** 兼容旧版 vert 分支的便捷函数 */
export function clusterToPolyVert(cluster: { pos: Coord }[]): ClusterPolyResult

/** 兼容旧版 inc 分支的便捷函数 */
export function clusterToPolyInc(cluster: { pos: Coord }[]): ClusterPolyResult
```

- 内部使用 `coordDotProduct`、`coordMut`、`coordAdd` 等现有工具函数。
- 零方向或空 cluster 给出安全回退（与 `clusterToPolyVert` 一致）。

### 5.4 修改 `src/models/cvs/workers/clusterCvsWorker.ts`（已完成）

在 `clustersToPolys` 中增加 free 点分支，并统一使用 `clusterPolyAngle` 函数替代原内部实现：

```ts
const freePtDirectionStore = useFreePtDirectionStore()

if (asIs) {
    poly = c.map(x => x.pos)
} else if (c.some(x => x.free)) {
    const directions = c
        .filter(x => x.free)
        .map(x => freePtDirectionStore.getPtDirections(x.id))
        .flat()
    const best = directions.length > 0
        ? clusterToPolyMinimumArea(c, directions)
        : clusterToPolyVert(c)
    poly = best.poly
} else if (incCount === 0) {
    poly = clusterToPolyVert(c).poly
} else if (vertCount === 0) {
    poly = clusterToPolyInc(c).poly
} else {
    const polyVert = clusterToPolyVert(c)
    const polyInc = clusterToPolyInc(c)
    poly = polyInc.area < polyVert.area ? polyInc.poly : polyVert.poly
}
```

> `getPtDirections` 从 `freePtDirectionStore` 读取缓存，避免每次绘制都重新遍历线路。

### 5.5 修改 `src/models/stores/snapStore.ts`（已完成）

使用 `freePtDirectionStore.getAdjacentSeg` 替代内联 `getAdjacentSegs`。

### 5.6 与 `src/models/stores/saveDerived/staClusterStore.ts` 的关系（已完成）

`staClusterStore` 无需再维护方向缓存，直接引用 `freePtDirectionStore`（如后续需要）。

## 6. 性能考虑

- **统一缓存**：方向计算全部集中在 `freePtDirectionStore`。它依赖 `saveStore.save` 的响应式引用，save 变化时自动失效并重新计算；`clusterCvsWorker` 和 `snapStore` 读取同一个缓存，避免重复计算。
- **计算复杂度**：只对 free 点计算方向，数量为 f，因此复杂度为 O(f * m)，其中 m 是单点平均出现次数。
- **四角点计算**：对 k 个候选方向，cluster 大小为 m，则每次绘制复杂度为 O(k * m)。k 通常很小（单点最多 2~3 个方向，cluster 内总方向数不超过 10~20）。
- **可选优化**：如果某些候选方向明显不是最优（如角度相近），可以进一步按角度去重或只保留主要方向。
- **兼容性**：非 free 点的 cluster 保持现有分支，不增加任何开销；snap 的 `getAdjacentSeg` 调用量与现有实现相当。

## 7. 边界情况

| 场景 | 处理 |
|------|------|
| 单点 cluster | 无方向，回退到 `clusterToPolyVert`，结果等价于当前点位置的小矩形。 |
| 无方向 cluster | 例如孤立点组成的 cluster，回退到 `clusterToPolyVert`。 |
| 点在线路中多次出现 | `adjacentSegs` 返回多个 segment，合并所有方向后再去重。 |
| 相邻点极近导致方向退化 | 跳过长度小于 ε 的线段，避免产生 `[0, 0]` 方向。 |
| 方向数量很多 | 去重后仍较多时，优先尝试主方向；如果性能敏感，可限制候选方向数量。 |
| 所有点共线 | 任意垂直方向的面积都相同，取第一个候选方向即可。 |
| 包含非 free 点的 free cluster | 只从 free 点收集方向；非 free 点参与面积计算，但不贡献候选方向。 |
| 纯非 free 点 cluster | 保持现有 `vert/inc` 逻辑，不进入新分支。 |

## 8. 与 nameEditStore 的关系

`nameEditStore.getAdjacentPtsPos` 使用 `getRectOfCluster` 获取四角点，用于自动站名位置推荐。`getRectOfCluster` 目前返回轴对齐矩形，与 `clusterToPolyVert` 等价。

**改造建议**：

- 第一步：保持 `getRectOfCluster` 不变，仅修改 cluster 绘制逻辑。这样站名推荐不会立刻受新行为影响。
- 第二步（可选）：当新绘制逻辑稳定后，再考虑让 `nameEditStore` 也使用“实际绘制四角点”辅助站名避让，使站名位置与视觉上 cluster 的形状一致。这可以单独评估。

## 9. 测试计划

### 9.1 `clusterPolyAngle.ts` 单测

目标文件：`src/tests/unit/utils/clusterPolyAngle.test.ts`（新建）。

新增用例：

- 给定 0° 方向，结果与 `clusterToPolyVert` 一致。
- 给定 45° 方向，结果与 `clusterToPolyInc` 一致。
- 给定 30° 方向，验证四角点坐标与面积计算正确。
- 退化：单点、两点共线、矩形顶点顺序为顺时针。
- 空 cluster 或零方向应安全回退。

### 9.2 `ptDirection.ts` 与 `freePtDirectionStore` 单测

目标文件：
- `src/tests/unit/utils/ptDirection.test.ts`（新建，纯函数测试）。
- `src/tests/unit/saveDerived/freePtDirectionStore.test.ts`（新建，store 缓存测试）。

`ptDirection.test.ts` 用例：

- 两侧存在且共线：产生 1 个方向。
- 两侧存在且成角：产生 2 个方向。
- 只有 prev：产生 1 个方向。
- 只有 next：产生 1 个方向。
- 孤立点：无方向。
- 相邻点极近：跳过该侧。
- 方向与反方向归一化到同一角度。

`freePtDirectionStore.test.ts` 用例：

- 构造两点一线且其中一点为 free，验证 `getAdjacentSeg` 返回正确 `prev`/`next`。
- 构造拐角三点且拐点为 free，验证 `getPtDirectionInfo` 的 `prev`/`next`/`all` 正确。
- 构造非 free 点，验证 `getAdjacentSeg` 和 `getPtDirections` 返回 `undefined`/`[]`。
- 修改 save 后（移动 free 点），验证缓存自动重新计算。
- 验证 `getPtDirections` 与 `getPtDirectionInfo.all` 一致。
- 构造一个 free 点属于两条不同方向线路的场景，验证 `all` 包含两个方向，而 `prev`/`next` 只来自第一次出现。

### 9.3 集成测试

目标文件：`src/tests/unit/cvs/clusterCvsWorker.test.ts`（如不存在则新建）。

新增用例：

- 构造一个含 free 点的 cluster，断言其绘制四角点方向贴合实际线段方向。
- 构造非 free 点 cluster，断言行为与改造前一致。
- 混合 cluster（free + 非 free）使用新分支。
- 构造含 free 点的 snap 场景，断言 `snapStore` 仍能正确通过 `freePtDirectionStore` 获取相邻段并生成吸附候选。

### 9.4 回归测试

- `pnpm test -- --run` 全量通过。
- `pnpm type-check` 通过。

## 10. 实现顺序建议

1. 新增 `src/utils/ptUtils/ptDirection.ts` 与单测（纯方向计算逻辑）。
2. 新增 `src/models/stores/saveDerived/freePtDirectionStore.ts`：
   - 提供 `getAdjacentSeg` / `getPtDirectionInfo` / `getPtDirections`。
   - 用单测验证缓存与 `saveStore` 同步。
3. 修改 `src/models/stores/snapStore.ts`：使用 `freePtDirectionStore.getAdjacentSeg` 替代内联 `getAdjacentSegs`。
4. 新增 `src/utils/clusterUtils/clusterPolyAngle.ts` 与单测。
5. 修改 `src/models/cvs/workers/clusterCvsWorker.ts`：增加 free 点分支，调用 `freePtDirectionStore` 和 `clusterPolyAngle`。
6. 跑通全部测试与类型检查。
7. （可选）再评估是否让 `nameEditStore` 也使用新四角点。

## 11. 实现状态

- [x] 新增 `src/utils/ptUtils/ptDirection.ts`
- [x] 新增 `src/models/stores/saveDerived/freePtDirectionStore.ts`
- [x] 修改 `src/models/stores/snapStore.ts` 使用 `freePtDirectionStore`
- [x] 新增 `src/utils/clusterUtils/clusterPolyAngle.ts`
- [x] 修改 `src/models/cvs/workers/clusterCvsWorker.ts` 增加 free 点分支并统一四角点实现
- [x] 补充对应单测
- [ ] 评估是否让 `nameEditStore` 也使用新四角点（可选，暂缓）

> 本方案为计划文档，暂不实际修改代码。
