# 按 FlatSpan 分段渲染线路 — 实现计划

> 状态：调研完成，待实现  
> 最后更新：2026-05-05

---

## 一、当前架构理解

### 1.1 线路渲染流程

```
mainCvsDispatcher.renderMainCvs()
  └─ lineCvsWorker.renderAllLines(ctx, LineType.common)
       └─ 对每条线路（parent + children）:
            renderLine(ctx, [line, ...children])
              ├─ formalize(pts) → FormalPt[]   // 插值生成几何路径点
              ├─ draw('carpet')                // 白色底边
              └─ draw('body')                  // 彩色本体
```

### 1.2 关键概念：FormalPt

`FormalPt` 是**线路在 canvas 上的实际几何路径点**，由 `formalize()` 根据控制点插值生成：

```
控制点 pts:     x----x-----x-----x----x
ptIdx:          0    1      2      3    4

FormalPts:      x--x-x-x-x-x--x--x--x--x
afterIdxEqv:    0--1-1-1-1-2--2--3--3--4
                ↑  ↑     ↑  ↑
                │  └── itp（插值点）
                └───── 控制点本身
```

`afterIdxEqv` 表示该 formalPt 属于**哪个控制点区间之后**（即 `line.pts[i]` 到 `line.pts[i+1]` 之间）。

### 1.3 当前颜色/状态决策

`lineStateStore.ts` 是**唯一颜色决策源**：

```
lineActualColors: Map<lineId, {color, downplayed?}>
  ├─ 基础色 = line.color / colorPre 预设
  ├─ 强调淡化: 非强调线路 → 灰度化
  └─ 时间淡化: time.open > effectiveTimeMoment → 灰度化
```

**问题**：当前 `line.time` 只用于整线级别的"是否淡化"二元决策，没有按区段区分。

### 1.4 LineStyle 渲染

`doRender()` 中：
- 无 `LineStyle` → 纯色 stroke
- 有 `LineStyle` → `strokeStyledLine()` 逐层渲染（base + style layers）

当前 `line.style` 是**整线级别**的属性。

---

## 二、目标行为

### 2.1 核心需求

将线路从"整条线统一渲染"改为**按 `FlatSpan` 分段渲染**：

```
线路 pts: [A, B, C, D, E]

StyleSlice: B→D 使用 style=100（虚线）
TimeSlice:  C→E 使用 time={open: 2030}

当前渲染:  一整条实线，统一颜色
目标渲染:
  A→B: 默认样式（Line.style / Line.color）
  B→C: StyleSlice 样式（虚线）
  C→D: StyleSlice 样式（虚线）+ TimeSlice 时间状态
  D→E: TimeSlice 时间状态（默认样式）
```

### 2.2 优先级规则

| 属性 | 优先级 |
|------|--------|
| 样式 | `StyleSlice.style` > `Line.style` > 无样式（纯色） |
| 时间 | `TimeSlice.time` > `Line.time` > 无时间 |
| 颜色 | 先按上述规则取样式，再应用 `lineStateStore` 的淡化逻辑 |

---

## 三、实现步骤

### Step 1: 扩展 `lineStateStore` — 支持 span 级别颜色决策 ✅ 已完成

**文件**: `src/models/stores/saveDerived/state/lineStateStore.ts`

当前 `lineActualColors` 是 `Map<lineId, {color, time, downplayed}>`，需要扩展为支持 span 级别查询：

```typescript
// 新增：获取指定 span 的实际颜色
function getSpanActualColor(lineId: number, spanIdx: number): string

// 新增：获取指定 span 是否被淡化
function isSpanDownplayed(lineId: number, spanIdx: number): boolean
```

实现思路：
1. 先计算整线的基础色（不变）
2. 淡化逻辑需要按 span 的时间信息分别判断
3. 如果 span 有 `TimeSlice.time`，用 slice 的时间；否则用 `Line.time`

**注意**：淡化逻辑（强调 + 时间）需要重新计算，因为不同 span 可能有不同的时间状态。

### Step 2: 修改 `lineCvsWorker.renderLine()` — 按 span 拆分渲染

**文件**: `src/models/cvs/workers/lineCvsWorker.ts`

当前 `renderLine()` 对每条线路：
1. `formalize(pts)` → 整条线的 FormalPt[]
2. `linkPts()` → 一条完整 path
3. `doRender()` → 一次 stroke

需要改为：
1. 获取 `flattened = flatSliceStore.getFlattenedLine(l.id)`
2. 对每个 `span` in `flattened.spans`:
   a. 从整线 FormalPt[] 中截取该 span 对应的子集
   b. `beginPath()` + `linkPts(spanFormalPts)` + `doRenderSpan()`

**关键问题：如何截取 span 对应的 FormalPt[]？**

利用 `FormalPt.afterIdxEqv`：

```typescript
// span: fromIdx=1, toIdx=3（对应 pts[1]→pts[3]，即 B→D）
// 需要找到 afterIdxEqv 在 [1, 3] 范围内的 formalPts
const spanFormalPts = allFormalPts.filter(
  fp => fp.afterIdxEqv >= span.fromIdx && fp.afterIdxEqv <= span.toIdx
)
// 但还需要包含 pts[fromIdx] 本身的点...
```

**更准确的截取逻辑**：

```typescript
function extractFormalPtsForSpan(
  allFormalPts: FormalPt[], 
  span: FlatSpan
): FormalPt[] {
  // formalPts 的 afterIdxEqv 含义：
  // - 控制点本身：afterIdxEqv = 该点在 pts 中的索引
  // - 插值点：afterIdxEqv = 该插值点所在区间的前一个控制点索引
  // 
  // 例如 pts=[A,B,C], formalPts=[A, itp1, itp2, B, itp3, C]
  // afterIdxEqv: [0, 0, 0, 1, 1, 2]
  //
  // span fromIdx=0, toIdx=1 (A→B):
  // 需要包含 afterIdxEqv <= 1 的点，且从 A 开始
  // 结果: [A, itp1, itp2, B]
  
  const startIdx = allFormalPts.findIndex(
    fp => fp.afterIdxEqv === span.fromIdx
  )
  const endIdx = allFormalPts.findLastIndex(
    fp => fp.afterIdxEqv === span.toIdx - 1 || fp.afterIdxEqv === span.toIdx
  )
  // TODO: 需要更仔细地处理边界，尤其是 ring 线路
  return allFormalPts.slice(startIdx, endIdx + 1)
}
```

**⚠️ Ring 线路的特殊处理**：

Ring 线路的 `formalize()` 会额外生成首尾 margin segment，截取时需要特别处理，避免破坏 ring 的闭合性。

### Step 3: 修改 `doRender()` — 支持 per-span 样式

**文件**: `src/models/cvs/workers/lineCvsWorker.ts`

当前 `doRender()` 参数：
```typescript
function doRender(ctx, lineInfo, enforceNoFill?, enforceLineWidth?, type?, strokeTarget?)
```

需要扩展为接受**每个 span 的样式覆盖**：

```typescript
function doRender(
  ctx: CvsContext, 
  lineInfo: Line, 
  spanStyle?: LineStyle,      // 来自 StyleSlice 或 Line.style
  spanColor?: string,         // 来自 lineStateStore（已考虑淡化）
  spanDownplayed?: boolean,   // 是否淡化
  ...
)
```

或者保持 `doRender` 不变，在调用前通过 `lineInfo` 的临时覆盖来传递：

```typescript
// 创建临时 Line 对象，只覆盖 style 属性
const spanLineInfo = { ...lineInfo, style: spanStyleId }
doRender(ctx, spanLineInfo, ...)
```

### Step 4: Carpet 渲染策略

当前 carpet（白色底边）是整线统一绘制的。改为 per-span 后有两种策略：

**策略 A：每个 span 独立画 carpet**
- 优点：不同 span 可以有不同宽度
- 缺点：span 交界处可能有缝隙

**策略 B：先统一画整线 carpet，再逐个画 body**
- 优点：无接缝问题
- 缺点：carpet 宽度必须统一，无法支持 per-span 宽度变化

**建议**：先采用策略 B（保持现有 carpet 逻辑不变，只拆分 body），因为 `LineStyle` 主要影响 body 样式，carpet 只是白色背景。

### Step 5: 处理 children / line group

当前 `renderLine(ctx, [parent, ...children])` 会：
1. 分别 formalize 每条线
2. 如果样式不同，逐条画；如果样式相同，合并 path 一笔画

改为 per-span 后，children 的处理：
- 每个 child 独立调用 `renderLine()`（因为它们有自己的 slice）
- 或者保持现有逻辑，但内部再按 span 拆分

### Step 6: 更新其他 canvas worker（本次不改）

根据答复，以下 worker **本次改造不涉及**：

| Worker | 结论 | 原因 |
|--------|------|------|
| `pointCvsWorker` | 不改 | 车站圆圈使用线路主色，style 不影响 |
| `textTagCvsWorker` | 不改 | 标签颜色使用整线颜色即可 |
| `lineSimplifiedCvsWorker` | 不改 | 略缩图保持整线渲染 |
| `lineExtendCvsWorker` | 不改 | 只画手柄，不画线路本体 |
| `emphasizeCvsWorker` | 不改 | 只画圆环高亮 |
| `terrainSmoothCvsWorker` | 待评估 | 地形线通常无 slice，暂不改 |

### Step 7: 性能优化

per-span 渲染会增加 `beginPath/stroke` 调用次数：
- 无 slice：1 次（整线一个 span）
- 有 slice：span 数量次

优化方向：
1. `flatSliceStore.allFlattened` 是 computed，避免重复计算
2. FormalPt 截取可以缓存
3. 如果相邻 span 样式相同，可以合并 path 一次 stroke

---

## 四、待澄清的疑问

### Q1: 环形线路的 span 截取

Ring 线路的 `formalize()` 会生成额外的首尾 margin segment。当 `FlatSpan` 跨越 ring 的闭合点（如 pts[0] == pts[last]）时，如何正确截取 FormalPt？

**答复**：
- 请注意 formalize 结尾处的逻辑，margin 段只是其内部辅助判断作用，最终返回前已经被切掉：
  ```ts
    if(isRingLine){
      formalSegs.shift()
      formalSegs.pop()
    }
  ```

### Q2: 车站圆圈颜色（pointCvsWorker）

当车站位于不同 style 的 span 交界处时，圆圈颜色应该反映哪个 span？

**答复**：
- style 并不影响主要颜色，车站目前使用线路颜色即可

### Q3: 时间淡化的粒度

当前 `effectiveTimeMoment` 是一个全局值。如果线路前半段已开通、后半段规划中，用户期望：
- 前半段正常显示，后半段淡化？
- 还是整线统一处理？

这会影响 `lineStateStore` 的淡化逻辑设计。

**答复**：
- 未开通的区间淡化，已开通的正常显示

### Q4: 简化渲染（lineSimplifiedCvsWorker）

略缩图/导出缩略图是否需要 per-span 渲染？

**答复**：暂时不管

### Q5: span 间的圆弧过渡

`linkPts()` 在相邻 segment 之间会画圆弧过渡。如果 span 边界恰好位于控制点处，圆弧是否会被正确绘制？

**需要验证**：span A→B 的结尾和 span B→C 的开头，各自的圆弧是否衔接自然。

**答复**：span 交界处不管圆弧的问题，（如果 span 交界处拐弯了，形成折线是预期行为）

### Q6: 样式层叠（strokeStyledLine）的 dash 模式

如果 span A 是实线、span B 是虚线，dash pattern 在 span 边界处是否会"断掉"？

Canvas `setLineDash` 的偏移需要手动管理，否则虚线在每个 span 开头都会重新开始。

**答复**：暂时不管，后续再处理

---

## 五、文件改动清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `src/models/stores/saveDerived/state/lineStateStore.ts` | 扩展 | 新增 span 级别颜色/淡化查询 |
| `src/models/cvs/workers/lineCvsWorker.ts` | 重构 | `renderLine()` 按 span 拆分，`doRender()` 支持 per-span 样式 |
| `src/models/cvs/workers/pointCvsWorker.ts` | 不改 | 车站圆圈使用线路颜色，style 不影响主色 |
| `src/models/cvs/workers/textTagCvsWorker.ts` | 不改 | 标签颜色使用整线颜色即可 |
| `src/models/cvs/workers/lineSimplifiedCvsWorker.ts` | 不改 | 略缩图保持整线渲染 |
| `src/models/cvs/workers/lineExtendCvsWorker.ts` | 不改 | 只画手柄，不画线路本体 |
| `src/models/cvs/workers/emphasizeCvsWorker.ts` | 不改 | 只画圆环高亮 |

---

## 六、建议的实现顺序

1. ~~**先做 Step 1**（lineStateStore 扩展）+ 测试~~ ✅ 已完成
2. ~~**再做 Step 2-3**（lineCvsWorker 核心改造）+ 测试~~ ✅ 已完成
3. **处理 Q1**（ring 线路 — 确认 margin 段已切掉，无需特殊处理）
4. **性能测试**：对比 per-span 前后的渲染帧率
