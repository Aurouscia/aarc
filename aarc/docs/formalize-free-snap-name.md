# free 点的站名吸附（snapName）改造方案

## 背景

当前拖动站名时（`envStore.ts` 中 `activePtType == 'name'` 分支调用 `snapStore.snapName`），吸附候选由 `calcStaNameSnapCandidates`（`src/utils/snapUtils/snapCore.ts`）生成：

- 固定 4 个正交方向（上下左右）；
- 按 `editorLocalConfig.staNameSnapDiagonal` 配置追加 4 个内侧对角和/或 4 个外侧对角；
- 合计 4/8/12 个候选位置，全部基于坐标轴/45° 量化。

此外 `snapNameToCandidates` 还有 **vague 吸附**：当 `|nameP.x|` 或 `|nameP.y|` 小于 `snapOctaRayPtNameThrs` 时把该轴归零，即"站名与站心在坐标轴上对齐、可沿轴滑动"。

对 free 点，其前后区间是任意角度的 direct seg，轴对齐的候选与 vague 轴线都没有几何意义。参考 `formalize-free-snap-interpt.md` 的思路：free 点的几何应由其实际线段方向决定。因此，free 点的站名吸附改为**仅吸附线路法向（线路方向偏转 90°）的位置**：

- 每个线路方向贡献 ±法向共 **2 个**候选；
- 两侧线路方向不同（拐角）时有 2 个方向，共 **4 个**候选；
- 点在多条线路中出现时可能有更多方向，统一使用 `PtDirectionInfo.all`（每个方向 2 个，共 2k 个）。

`nameP` 是相对站心的偏移量，因此候选也是相对偏移（`±snd·n`），无需加站心坐标。

---

## 1. 触发条件

在 `snapStore.getStaNameSnapPoss(ptId)` 中判断：

```ts
const pt = saveStore.getPtById(ptId)
if (pt?.free) {
    // 使用法向候选
} else {
    // 保持现有 calcStaNameSnapCandidates 逻辑
}
```

vague 吸附的规则同步切换（见第 3 节），由 `snapName` / `snapNameStatus` 在调用 core 函数时传入 free 点的方向信息。

---

## 2. 候选生成算法

### 2.1 数据来源

复用 `freePtDirectionStore.getPtDirectionInfo(ptId)`（`src/models/stores/saveDerived/freePtDirectionStore.ts`），取 `PtDirectionInfo.all`：所有非退化方向，已去重并归一化到 `[0, π)` 区间（`u` 与 `-u` 等价）。因此：

- 单侧邻点、两侧共线 → `all.length === 1` → 2 个候选；
- 拐角（两侧方向不同）→ `all.length === 2` → 4 个候选；
- 多条线路经过 → `all.length === k` → 2k 个候选。

### 2.2 候选计算

对每个方向 `u ∈ all`，取其单位法向 `n = [-u[1], u[0]]`（逆时针 90°），生成：

```ts
candidates.push(coordMut(n, snd), coordMut(coordInv(n), snd))
```

其中 `snd = cs.config.snapOctaClingPtNameDist × distRatio`，`distRatio` 仍由 `staClusterStore.getMaxSizePtWithinCluster(ptId, 'ptNameSnapSize')` 提供，与非 free 点一致。

`u` 已归一化到 `[0, π)`，两个方向平行时会被去重，不会产生重复法向；`n` 与 `-n` 天然成对，无需额外去重。

### 2.3 新文件 `src/utils/snapUtils/snapNameFree.ts`

仿照 `snapInterPtFree.ts` 的先例，free 分支逻辑抽为独立纯函数文件，核心导出：

```ts
/** 由 free 点的方向集合生成站名吸附候选（相对站心的偏移） */
export function computeFreeNameSnapCandidates(
    dirs: Coord[],
    snd: number
): Coord[]

/**
 * 求 nameP 到最近法向直线的有符号距离与投影点。
 * 法向直线 = 过原点、方向为 perp(u) 的直线；nameP 到它的有符号距离 = dot(nameP, u)。
 */
export function projectToNearestNormalLine(
    nameP: Coord,
    dirs: Coord[]
): { distAbs: number, proj: Coord } | undefined
```

`dirs` 为空时：`computeFreeNameSnapCandidates` 返回 `[]`；`projectToNearestNormalLine` 返回 `undefined`。

---

## 3. vague 吸附：沿法向滑动

非 free 点的 vague 语义是"与站心在 x 轴或 y 轴上对齐，可沿该轴滑动"。free 点的对应语义改为"**站名落在某条法向直线上，可沿该法向滑动**"。

### 3.1 判定与投影

`nameP` 到方向 `u` 的法向直线的有符号距离为 `dot(nameP, u)`。对所有 `u ∈ all` 取绝对值最小者：

- 若 `|dot(nameP, u)| < snapRayThrs`（`snapOctaRayPtNameThrs`），吸附成功：
  ```ts
  to = nameP - u * dot(nameP, u)   // 投影到法向直线
  type = 'vague'
  ```
- 多个方向同时满足时取距离最小者；不做"两条法向同时吸附"的组合（法向直线只交于站心，交点即 `nameP = [0,0]`，无意义）。

### 3.2 状态回显

`getNameSnapStatus` 的 vague 判定同步改为：存在 `u ∈ all` 使 `|dot(nameP, u)| < numberCmpEpsilon`。accu 判定不变（仍与候选列表比较），保证状态指示与实际吸附行为一致。

---

## 4. 与现有代码的集成

### 4.1 `snapCore.ts` 改动

给 `snapNameToCandidates` 与 `getNameSnapStatus` 增加可选参数 `freeDirs?: Coord[]`（free 点的方向集合，即 `PtDirectionInfo.all`）：

```ts
export function snapNameToCandidates(
    pt: ControlPoint,
    candidates: Coord[],
    snapClingThrsSq: number,
    snapRayThrs: number,
    freeDirs?: Coord[]        // 传入表示按 free 规则做 vague 吸附
): SnapNameResult | undefined
```

- accu 判定逻辑不变（候选列表本身由调用方换成法向候选）；
- `freeDirs` 非空时，vague 走 `projectToNearestNormalLine`；`freeDirs` 未传入或为空时，走现有轴线归零逻辑。

### 4.2 `snapStore.ts` 改动

```ts
function getStaNameSnapPoss(ptId: number): Coord[] {
    const distRatio = staClusterStore.getMaxSizePtWithinCluster(ptId, 'ptNameSnapSize')
    const snd = cs.config.snapOctaClingPtNameDist * distRatio
    const pt = saveStore.getPtById(ptId)
    if (pt?.free) {
        const dirs = freePtDirectionStore.getPtDirectionInfo(ptId)?.all ?? []
        if (dirs.length > 0) {
            return computeFreeNameSnapCandidates(dirs, snd)
        }
        // 孤立/无方向 free 点：回退到标准候选
    }
    return calcStaNameSnapCandidates(
        cs.config.snapOctaClingPtNameDist,
        distRatio,
        editorLocalConfig.staNameSnapDiagonal
    )
}
```

`snapName` 与 `snapNameStatus` 在 `pt.free` 时把 `freePtDirectionStore.getPtDirectionInfo(pt.id)?.all` 作为 `freeDirs` 传给 core 函数（无方向时不传，vague 保持轴线归零，与候选回退口径一致）。

### 4.3 配置项影响

- `staNameSnapDiagonal`（inner/outer/both）对**有方向的** free 点不再生效，因为方向由实际几何决定；仅对回退情形和非 free 点生效。无需改动配置结构。
- `snapOctaClingPtNameDist`、`snapOctaClingPtNameThrsSq`、`snapOctaRayPtNameThrs` 语义不变，直接复用。

### 4.4 不在本次范围内

- `nameEditStore.optimizedNamePos`（自动站名位置）会用 `getStaNameSnapPoss` 的返回值做 8 方向 `sgnCoord` 匹配；free 候选是任意角度，匹配结果不精确（可能借 `sgnCoord` 量化撞上某个方向）。本方案**不修改** `nameEditStore`，仅记录该已知影响；自动排版对 free 点的适配与 `formalize-free.md` §4.4 描述的是同一问题，留作后续独立任务。
- 站名吸附候选目前没有在画布上渲染预览点（只有吸附状态指示），因此无渲染侧改动。

---

## 5. 边界情况

| 场景 | 处理 |
|------|------|
| 单侧邻点（端点 free 点） | `all` 有 1 个方向 → 2 个法向候选 + 1 条法向滑动线。 |
| 两侧共线 | `all` 去重后 1 个方向，同上。 |
| 拐角（两侧方向不同） | `all` 有 2 个方向 → 4 个候选 + 2 条法向滑动线，vague 取最近者。 |
| 多条线路经过（`all` > 2） | 每个方向 2 个候选，共 2k 个；vague 同样取最近法向。 |
| 孤立点/无方向（`all` 为空） | 候选回退到标准 4/8/12 方向（按 `staNameSnapDiagonal` 配置），vague 保持轴线归零。 |
| 邻点极近导致方向退化 | `computePtDirectionInfo` 已跳过长度 < ε 的线段，无需额外处理。 |
| `nameP` 同时贴近两条法向线 | vague 取距离最小者，不组合。 |
| free 点在车站团内 | `distRatio` 仍取团内最大 `ptNameSnapSize`，候选距离与非 free 一致。 |

---

## 6. 测试计划

### 6.1 `snapNameFree.ts` 单测（新建 `src/tests/unit/utils/snapNameFree.test.ts`）

- 单方向 `u = [1, 0]`、`snd = 1` → 候选 `[0, 1]`、`[0, -1]`。
- 两方向（如水平 + 45°）→ 4 个候选，坐标正确。
- `dirs = []` → 返回 `[]`。
- `projectToNearestNormalLine`：给定点在某法向线附近时返回正确投影与距离；多条法向时取最近；`dirs = []` 返回 `undefined`。

### 6.2 `snapCore.ts` 改动单测（补充到 `snapCore.test.ts`）

- `snapNameToCandidates` 传入 `freeDirs`：`nameP` 距法向线 < 阈值时返回 `type: 'vague'` 且 `to` 为投影点；远离所有法向线时返回 `undefined`；贴近候选时仍返回 `accu`。
- `getNameSnapStatus` 传入 `freeDirs`：`nameP` 在法向线上 → `vague`；在候选上 → `accu`；其余 → `undefined`。
- 回归：不传 `freeDirs` 时行为与改造前完全一致（现有用例必须全绿）。

### 6.3 集成验证

- 构造含 free 点的任意角度线路，拖动站名：候选只出现在法向上；靠近法向线可沿线滑动；状态指示与实际吸附一致。
- 非 free 点拖动站名，行为与改造前一致。

### 6.4 回归

- `pnpm test:run` 全量通过；`pnpm type-check` 通过。

---

## 7. 实现顺序建议

1. 新增 `src/utils/snapUtils/snapNameFree.ts` 与单测。
2. 修改 `snapCore.ts`：`snapNameToCandidates` / `getNameSnapStatus` 增加 `freeDirs` 参数，补单测。
3. 修改 `snapStore.ts`：`getStaNameSnapPoss` 增加 free 分支与回退；`snapName` / `snapNameStatus` 传入 `freeDirs`。
4. 跑通全部测试与 `pnpm type-check`。

## 8. 实现状态

- [x] 新增 `src/utils/snapUtils/snapNameFree.ts`
- [x] 修改 `snapCore.ts` 支持 free 站名 vague 吸附
- [x] 修改 `snapStore.ts` 接入 free 分支
- [x] 补充单测并通过全量回归（605 项测试与 `pnpm type-check` 通过）
