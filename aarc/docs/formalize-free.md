# 控制点“自由点”改造计划

## 背景与目标

给 `ControlPoint` 新增布尔属性 `isFree`（是否自由）。自由点的含义是：

- 该点前后两个区间不再进行 formalize（不插值）。
- 这两个区间不再接受病态矫正，也不作为“健康段”去矫正别的区间。
- 渲染时直接与前/后一个点用直线连接。

主要触发本改造的场景是：自由点允许线路出现任意角度，因此圆角生成逻辑需要从“仅支持 90°/135°（基于 `SgnCoord` 的 8 方向量化）”推广到任意角度。

---

## 1. 数据模型改动

### 1.1 `src/models/save.ts`

在 `ControlPoint` 接口新增可选字段：

```ts
export interface ControlPoint {
    // ... 原有字段
    isFree?: boolean  // 默认 false/undefined 表示非自由点
}
```

- 旧存档没有该字段，等价于 `false`，向后兼容。
- 如需在规范化时显式补默认值，可在 `saveNormalize.ts` 里给所有点统一填充 `isFree ??= false`（可选）。

### 1.2 `src/models/coord.ts`

给 `FormalPt` 增加可选标记，方便渲染侧识别自由点：

```ts
export interface FormalPt {
    pos: Coord
    afterIdxEqv: number
    isFree?: boolean  // 若该点是自由点，标记为 true
}
```

该字段不参与 span 截取等核心逻辑，仅用于渲染、UI 等上层判断。

---

## 2. `formalize` 核心算法改造

目标文件：`src/utils/lineUtils/formalize.ts`。

### 2.1 区间拆分策略

把控制点序列按“自由点”拆成若干 **formalize 块（chunk）**，块与块之间由“直接段（direct seg）”连接。

- 若 `pts[i]` 与 `pts[i+1]` 之间至少有一个端点是自由点，则该区间是 **direct seg**。
- 否则属于某个 chunk，按现有逻辑 formalize。

示例：

```
A ── B(free) ── C ── D(free) ── E
```

- `A→B`：direct seg
- `B→C`：direct seg（B 是 free）
- `C→D`：direct seg（D 是 free）
- `D→E`：direct seg

只有 `B→C` 与 `C→D` 都直接与 B/D 相连，但 `C` 本身不是 free，所以 `B→C` 和 `C→D` 均为 direct seg，`C` 只是中转点。

更精确地说：**区间 `pts[i]→pts[i+1]` 是 direct 当且仅当 `pts[i].isFree || pts[i+1].isFree`**。

### 2.2 `FormalSeg` 的扩展

给 `FormalSeg` 增加标记，便于 `illPosedSegJustify` 跳过：

```ts
export interface FormalSeg {
    a: Coord
    itp: Coord[]
    b: Coord
    ill: number
    direct?: boolean  // true 表示自由点相邻的直接段
}
```

`direct` 段的生成规则：

- `itp = []`
- `ill = 0`
- `a = pts[i].pos`, `b = pts[i+1].pos`

### 2.3 `formalize` 主流程改造

1. 遍历所有相邻点对，按上述规则判断是否为 direct seg。
2. 把非 direct 的连续区间聚合成 chunk。
3. 对每个 chunk 调用现有 formalize 逻辑，得到该 chunk 的 `FormalSeg[]` 与 `FormalPt[]`。
4. 为所有 direct seg 生成 `FormalSeg` 并插入到正确位置。
5. 按顺序拼接所有 `FormalPt`，保证 `afterIdxEqv` 仍然等于原控制点索引（控制点本身）或前一个控制点索引（插值点）。

**afterIdxEqv 兼容性**：direct seg 没有插值点，因此不会破坏 `extractSpanFormalPts` 的语义。自由点自身的 `afterIdxEqv` 仍等于其原索引。

### 2.4 `illPosedSegJustify` 改造

- 遍历 `illIdxs` 时，**跳过所有 `direct === true` 的段**（它们既不被矫正，也不矫正别人）。
- 当某段需要被前后段矫正时，**前后helper 段中也必须跳过 direct 段**。具体实现：
  - 寻找 `prevSeg` 时，向左找到第一个非 direct 段。
  - 寻找 `nextSeg` 时，向右找到第一个非 direct 段。
  - 若找不到，则放弃矫正。

### 2.5 环线特殊处理

环线在 `formalize` 中会补 head/tail margin 段。需要保证：

- 若环线的首尾点是自由点（即 `pts[0] === pts[last]` 且该点 isFree），则首尾连接段为 direct。
- margin 段的构造应参考该点的 `isFree` 状态，避免错误地 formalize 闭合区间。

---

## 3. 渲染侧改造

### 3.1 `linkPts`（`src/models/cvs/workers/lineCvsWorker.ts`）

当前 `linkPts` 通过 `twinPts2SgnCoord` 把方向量化成 8 个 `SgnCoord`，并用 `rayRel` 把夹角归类为 `parallel/90/45/135`。自由点带来的任意角度需要两套分支：

#### 3.1.1 非自由点（保留现有逻辑）

沿用 `SgnCoord`、`rayRel`、`getTurnRadiusOf` 的现有路径。

#### 3.1.2 自由点（新增任意角度分支）

当 `nowPt.isFree === true` 或前后某一seg是 direct seg 时，进入新分支：

1. 用实际向量计算方向：
   - `prevVec = nowPt.pos - prevPt.pos`
   - `nextVec = nextPt.pos - nowPt.pos`
   - 归一化得到 `unitPrev`、`unitNext`
2. 计算实际夹角 `θ`：
   - `cosθ = dot(unitPrev, unitNext)`
   - `sinθ = cross(unitPrev, unitNext)`
   - `θ = atan2(|sinθ|, cosθ)`，范围 `[0, π]`
3. 计算切距 `d`（圆角在两边线段上占用的长度）：
   - 设配置给出的“基础半径”为 `r_base`（由 `getTurnRadiusOf` 提供，见 3.3）。
   - 若希望弧的**实际半径**保持为 `r_base`，则 `d = r_base / tan(θ/2)`。
   - 若希望保持切距与现有 90° 一致（即 `d ≈ r_base`），则由 `drawArc` 自动根据 `d` 算出实际半径。
   - **推荐**：先统一按“实际半径”语义改造，即 `d = r_base / tan(θ/2)`，clamp 到 `min(prevDist/2, nextDist/2)`。
4. 计算弧起点/终点：
   - `prevSok = nowPt.pos - unitPrev * d`
   - `nextSok = nowPt.pos + unitNext * d`
5. 绘制：
   - `ctx.lineTo(prevSok)`
   - 调用支持实际方向的 `drawArcByActualRays`（见 3.2）。

**退化处理**：
- `θ` 接近 0（同向）：直接 `lineTo(nowPt)`，不画弧。
- `θ` 接近 π（反向）：可视需求选择直接折线或最小半圆。
- 线段长度不足以容纳 `d`：按 `min(prevDist/2, nextDist/2)` 重新计算 `d`。

### 3.2 `drawArc.ts` 新增任意角度支持

目标文件：`src/utils/drawUtils/drawArc.ts`。

现有 `drawArcByTwoRays` 依赖 `FormalRay.way: SgnCoord`，只能表示 8 个方向。新增一套基于实际单位向量的实现：

```ts
export interface ActualRay {
    source: Coord
    way: Coord  // 已归一化的方向向量
}

export function drawArcByActualRays(
    ctx: CvsContext,
    a: ActualRay,
    b: ActualRay,
    radius?: number
)
```

实现要点（与现有 `drawArcByTwoRays` 类似，但用浮点方向）：

1. 若 `cross(a.way, b.way) ≈ 0`，两线平行，直接 `lineTo(b.source)`。
2. 将 `a.way`、`b.way` 各自旋转 90° 得到垂线方向。
3. 求两垂线交点得到圆心 `center`。
4. 若未传入 `radius`，用 `dist(center, a.source)` 计算。
5. 用 `Math.atan2` 计算起点角、终点角。
6. 根据 `cross(a.way, b.way)` 的符号决定 `counterClockwise`。
7. 调用 `ctx.arc(...)`。

现有 `drawArcByThreePoints(ctx, a, b, c)` 可保留，供 grid 角使用；自由点处改为调用 `drawArcByActualRays`。

### 3.3 `configStore.getTurnRadiusOf` 推广

目标文件：`src/models/stores/configStore.ts`。

当前：

```ts
function getTurnRadiusOf(line:Line|number, turnRel:WayRel, justify:'outer'|'middle'|'inner' = 'inner')
```

问题：
- `WayRel` 只能表达 `parallel/90/45/135`。
- 对 45/135 的半径修正因子是硬编码的，无法覆盖任意角度。

改造方案（二选一，推荐方案 B）：

**方案 A：最小改动**
- 增加重载 `getTurnRadiusOf(line, theta: number, justify?)`，其中 `theta` 是两段线的实际夹角（弧度）。
- 保留旧签名用于 grid 角；自由点处传 `theta`。
- 内部把 90°/45°/135° 的硬编码因子作为特例，其他角度用连续函数（如 `f(θ) = base / tan(θ/2)` 或基于视觉调参的曲线）。

**方案 B：统一角度语义（推荐）**
- 把 `getTurnRadiusOf` 的语义改为“返回圆角的实际半径”。
- 对 grid 角：
  - 90° → `base`
  - 45° → `base / (2.414 * 0.618)`（保持现有视觉）
  - 135° → `base * (2.414 * 0.618)`
- 对任意角：通过连续函数映射，保证在 90°/45°/135° 处与旧值一致。
- 调用方（`linkPts`）根据实际半径 `r` 和角度 `θ` 自行计算切距 `d = r / tan(θ/2)`。

> 注：无论选哪种，都需要与策划/设计者确认“任意角度圆角”的视觉标准（保持弧长相等、保持占用线段长相等，还是保持实际半径相等）。

---

## 4. 其他受影响模块

### 4.1 `terrainSmoothCvsWorker.ts`

地形圆滑渲染也会调用 `wayRel`、`getTurnRadiusOf`、`drawArcByThreePoints`。

- 若地形线路中出现自由点，`wayRel` 会给出错误的 45/135 分类。
- 需要在 `findTerrainTransitions` 或绘制阶段识别自由点相邻的 transition，改用实际角度计算。
- 推荐：复用 `drawArcByActualRays` 和新的 `getTurnRadiusOf` 重载。

### 4.2 `renderSegsAroundActivePt`（`lineCvsWorker.ts`）

选中点局部渲染会取 active 点前后最多 3 个点进行局部 formalize。

- 更新后的 `formalize` 已能处理自由点，这里主要需检查：
  - `trimLeft` / `trimRight` 逻辑是否会把自由点相邻的 direct seg 错误裁剪。
  - 局部窗口内若包含自由点，生成的 `formalizedSegs` 是否包含足够的点供 `linkPts` 计算圆角。
- 若自由点处需要实际角度，`linkPts` 在此处也应能拿到前后真实点坐标，因此通常无需额外改动，但需测试验证。

### 4.3 `lineExtendStore.ts`

线路延长按钮依赖 formalized segs 计算方向和长度。

- 自由端点的 formalized seg 是 direct seg，方向为实际方向。
- `coordRelDir` 目前返回 `vertical/incline` 两类，对自由点的任意角度会强行归类。
- 若延长按钮仍希望区分 vertical/incline 两种手柄长度，可保持现状；若需要真实方向，则改用实际向量。

### 4.4 `nameEditStore.ts`

自动站名位置通过 `findAdjacentFormalPts` 获取相邻 formal 点位置。

- 自由点相邻 formal 点位置就是实际前后控制点位置，因此 `afterIdxEqv` 正确即可正常工作。
- 但 `getAdjacentPtsPos` 用 `Math.sign` 把方向也量化成 8 向，自由点处的站名推荐方向可能不够精确，可考虑跳过自由点的方向优化或引入实际向量。

### 4.5 `snapStore.ts`

吸附逻辑依赖 `pt.dir` 决定正交/斜向吸附候选。

- 自由点是否还应受 `dir` 约束？建议：
  - **推荐**：自由点关闭八向网格吸附（`snapGrid` 仍可保留），或至少关闭基于 `dir` 的 `snapInterPt` 斜向/正交候选。
  - 否则“自由”之名与强制吸附到 8 方向矛盾。
- 具体：在 `snapInterPt` 中若 `pt.isFree` 为 true，只使用 `[0,0]` bias；在 `snapNeighborExtends` 中跳过自由点邻居的吸附线生成。

### 4.6 `lineSimplifiedCvsWorker.ts`

缩略图/简化渲染目前直接用 `ctx.lineTo` 连接 formal 点，不画自定义圆角。

- 自由点加入后只是 formal 点数量变少（direct seg 无插值），因此**无需改动**。
- 但缩略图上的圆角会由 `ctx.lineJoin='round'` 自动处理，可能与主画布不一致。若要求一致，则需把主画布的圆角逻辑也引入简化渲染。

---

## 5. UI / 交互改动

### 5.1 点属性面板

目标文件：`src/components/sidebars/options/ControlPointOptions.vue`。

在“点坐标”或新增区域增加一个开关：

```html
<label>
    <input type="checkbox" v-model="editing.isFree" />
    自由点（不参与 formalize，直连前后点）
</label>
```

- 勾选后 `editing.isFree = true`；未勾选或 undefined 视为 false。
- 可配合提示文字说明自由点会禁用该点前后区间的插值和病态矫正。

### 5.2 右键菜单/快捷键

当前右键点击控制点会切换 `dir`（vertical/incline）。

- 可保留原有行为，因为 `dir` 仍影响点标记、吸附、站名推荐等。
- 也可新增：右键+Shift 或右键菜单项切换 `isFree`。
- 建议先只通过属性面板暴露开关，减少交互改动。

### 5.3 点标记渲染

`pointCvsWorker.ts` 用 `pt.dir` 决定画“十”字的朝向（vertical/incline）。

- 自由点可考虑用不同标记（如空心圆、小圆点、或颜色区分），以便用户在画布上识别。
- 若不改动，自由点与普通点外观一致，但行为不同，可能造成困惑。
- 推荐：在 `drawCross` 之外为 `isFree` 点增加一个小标记（如圆环）。

---

## 6. 边界情况清单

| 场景 | 说明 |
|------|------|
| 自由点在线路首/尾 | 只影响一个相邻区间，直接连接端点即可。 |
| 相邻两个自由点 | 它们之间的区间也是 direct seg，无插值。 |
| 整条线全是自由点 | 等价于所有区间 direct，退化为一根折线。 |
| 环线且首尾为自由点 | 闭合段为 direct；head/tail margin 构造需避免 formalize 该闭合段。 |
| 自由点两侧都是病态段 | 自由点本身不矫正别人，因此两侧病态段只能互相矫正（若相邻且都非 direct）。 |
| span 边界恰好是自由点 | `extractSpanFormalPts` 通过 `afterIdxEqv` 截取，direct seg 无插值点，语义仍然成立。 |
| 自由点处线段极短 | 切距 `d` 会被 clamp 到 `min(prevDist/2, nextDist/2)`，避免弧起点越过对端点。 |
| θ 接近 0 或 π | 退化处理：同向不画弧，反向按设计选择折线或半圆。 |

---

## 7. 测试计划

### 7.1 `formalize` 单测（`src/tests/unit/utils/formalize.test.ts`）

新增用例：

- 单个自由点：`A(free)→B→C` 中 `A→B` 为 direct；`B` 与 `C` 所在 chunk 正常 formalize。
- 相邻自由点：`A(free)→B(free)→C` 中 `A→B`、`B→C` 均为 direct。
- 自由点两侧病态段：`A→B(free)→C`，其中 `A→B` 与 `B→C` 都是 vertical 对角线；验证它们不会被矫正（itp 为空）。
- 自由点不矫正别人：`A→B→C(free)→D`，`B→C` 为 direct，不应参与对 `A→B` 或 `C→D` 的矫正。
- 环线自由点：首尾为同一自由点时，闭合段为 direct。
- `afterIdxEqv` 正确性：含自由点的线路，span 截取后首尾 `afterIdxEqv` 符合预期。

### 7.2 渲染/圆角测试

- 由于 canvas 渲染难以在单元测试中断言像素，可先对 `drawArcByActualRays` 做纯几何测试：
  - 给定两条实际射线，验证圆心到两起点的距离相等。
  - 验证圆心位于两射线的垂线上。
  - 验证起点/终点角计算正确。
- 对 `linkPts` 的圆角切点计算做独立函数测试（把切点计算抽成纯函数）。

### 7.3 集成测试

- 在属性面板切换自由点后，重新渲染线路，观察：
  - 相邻区间是否消失插值点。
  - 圆角是否平滑（任意角度）。
  - 病态段是否不再被矫正。

---

## 8. 改造顺序建议

1. **数据模型**：`save.ts`、`coord.ts` 加字段。
2. **formalize 核心**：`formalize.ts` 实现 direct seg 拆分、跳过病态矫正、afterIdxEqv 正确性。
3. **测试补齐**：为 free 点形式化逻辑写单测，确保稳定。
4. **圆角通用化**：
   - `drawArc.ts` 新增 `drawArcByActualRays`。
   - `configStore.ts` 改造 `getTurnRadiusOf`。
   - `lineCvsWorker.ts` 的 `linkPts` 增加自由点分支。
5. **其他渲染**：`terrainSmoothCvsWorker.ts` 适配。
6. **UI/交互**：属性面板开关、点标记、右键/吸附行为。
7. **回归测试**：运行全部 `pnpm test:run` 与 `pnpm type-check`。
