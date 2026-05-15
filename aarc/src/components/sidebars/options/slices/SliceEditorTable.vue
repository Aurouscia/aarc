<script setup lang="ts">
import SideBar from '@/components/common/SideBar.vue';
import { Line, StyleSlice, TimeSlice } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';
import { useStaClusterStore } from '@/models/stores/saveDerived/staClusterStore';
import { computed, ref, useTemplateRef } from 'vue'

const props = defineProps<{
    line: Line
}>()

const saveStore = useSaveStore()
const staClusterStore = useStaClusterStore()
const sidebar = useTemplateRef('sidebar')

// ========== 站点列表（当前线路的点） ==========
const stations = computed(() => {
    return props.line.pts.map(ptId => {
        return {
            id: ptId,
            name: staClusterStore.getStaName(ptId)
        }
    })
})

// ========== Slice 列表（过滤当前线路） ==========
const timeSlices = computed<TimeSlice[]>(() =>
    saveStore.save?.timeSlices?.filter(s => s.line === props.line.id) || []
)

const styleSlices = computed<StyleSlice[]>(() =>
    saveStore.save?.styleSlices?.filter(s => s.line === props.line.id) || []
)

// ========== 单元格状态计算 ==========

type CellRole = 'start' | 'middle' | 'end' | 'empty'

interface CellInfo {
    role: CellRole
    sliceId?: number
}

/** 将 slice 的 fromPt/toPt（点ID）转换为在站点列表中的索引 */
function getSliceIndices(slice: TimeSlice | StyleSlice): { fromIdx: number, toIdx: number } | undefined {
    const fromIdx = props.line.pts.indexOf(slice.fromPt)
    const toIdx = props.line.pts.indexOf(slice.toPt)
    if (fromIdx === -1 || toIdx === -1) return undefined
    return { fromIdx, toIdx }
}

function getCellInfo(slices: (TimeSlice | StyleSlice)[], rowIdx: number): CellInfo {
    for (const slice of slices) {
        const indices = getSliceIndices(slice)
        if (!indices) continue
        const min = Math.min(indices.fromIdx, indices.toIdx)
        const max = Math.max(indices.fromIdx, indices.toIdx)
        if (rowIdx < min || rowIdx > max) continue
        if (rowIdx === min) return { role: 'start', sliceId: slice.id }
        if (rowIdx === max) return { role: 'end', sliceId: slice.id }
        return { role: 'middle', sliceId: slice.id }
    }
    return { role: 'empty' }
}

/** 判断某行单元格是否需要显示上半截 bar */
function needTopBar(slices: (TimeSlice | StyleSlice)[], rowIdx: number): boolean {
    const info = getCellInfo(slices, rowIdx)
    if (info.role !== 'start' && info.role !== 'end') return false
    const slice = slices.find(s => s.id === info.sliceId)
    if (!slice) return false
    const indices = getSliceIndices(slice)
    if (!indices) return false
    return rowIdx === Math.max(indices.fromIdx, indices.toIdx)
}

/** 判断某行单元格是否需要显示下半截 bar */
function needBottomBar(slices: (TimeSlice | StyleSlice)[], rowIdx: number): boolean {
    const info = getCellInfo(slices, rowIdx)
    if (info.role !== 'start' && info.role !== 'end') return false
    const slice = slices.find(s => s.id === info.sliceId)
    if (!slice) return false
    const indices = getSliceIndices(slice)
    if (!indices) return false
    return rowIdx === Math.min(indices.fromIdx, indices.toIdx)
}

// ========== 创建新 Slice 的交互 ==========

const pendingFrom = ref<{ col: 'time' | 'style'; rowIdx: number } | null>(null)

function onCellClick(col: 'time' | 'style', rowIdx: number) {
    const slices = col === 'time' ? timeSlices.value : styleSlices.value
    const info = getCellInfo(slices, rowIdx)

    // 点击已有片段：取消 pending
    if (info.role !== 'empty') {
        pendingFrom.value = null
        return
    }

    // 第一次点击空位：记录起点
    if (!pendingFrom.value || pendingFrom.value.col !== col) {
        pendingFrom.value = { col, rowIdx }
        return
    }

    // 第二次点击同列空位：尝试创建
    const fromIdx = pendingFrom.value.rowIdx
    const toIdx = rowIdx

    // 不能是同一点
    if (fromIdx === toIdx) {
        pendingFrom.value = null
        return
    }

    // 检查是否与现有 slice 重叠
    const min = Math.min(fromIdx, toIdx)
    const max = Math.max(fromIdx, toIdx)
    const hasOverlap = slices.some(s => {
        const indices = getSliceIndices(s)
        if (!indices) return false
        const sMin = Math.min(indices.fromIdx, indices.toIdx)
        const sMax = Math.max(indices.fromIdx, indices.toIdx)
        return !(max < sMin || min > sMax)
    })

    if (hasOverlap) {
        alert('与现有片段重叠')
        pendingFrom.value = null
        return
    }

    // 创建
    const fromPt = props.line.pts[fromIdx]
    const toPt = props.line.pts[toIdx]
    const newId = saveStore.getNewId()

    if (col === 'time') {
        if (!saveStore.save!.timeSlices)
            saveStore.save!.timeSlices = []
        const newSlice: TimeSlice = {
            id: newId,
            line: props.line.id,
            fromPt,
            toPt,
            time: {}
        }
        saveStore.save!.timeSlices.push(newSlice)
    } else {
        if (!saveStore.save!.styleSlices)
            saveStore.save!.styleSlices = []
        const newSlice: StyleSlice = {
            id: newId,
            line: props.line.id,
            fromPt,
            toPt,
            style: 0  // 默认样式，后续可编辑
        }
        saveStore.save!.styleSlices.push(newSlice)
    }

    pendingFrom.value = null
}

function isPending(col: 'time' | 'style', rowIdx: number): boolean {
    return pendingFrom.value?.col === col && pendingFrom.value?.rowIdx === rowIdx
}

// ========== 删除 Slice ==========

function onSliceClick(col: 'time' | 'style', sliceId: number) {
    const slices = col === 'time' ? saveStore.save?.timeSlices : saveStore.save?.styleSlices
    if (!slices) return
    const idx = slices.findIndex(s => s.id === sliceId)
    if (idx >= 0) {
        slices.splice(idx, 1)
    }
    pendingFrom.value = null
}

defineExpose({
    open: () => { sidebar.value?.extend() },
    fold: () => { sidebar.value?.fold() }
})
</script>

<template>
<SideBar ref="sidebar">
  <div class="slice-editor">
    <table>
      <thead>
        <tr>
          <th class="col-station">站点</th>
          <th class="col-slice">时间</th>
          <th class="col-slice">样式</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(station, idx) in stations" :key="station.id">
          <!-- 站点名 -->
          <td class="cell-station">{{ station.name }}</td>

          <!-- 时间 slice 列 -->
          <td
            class="cell-slice"
            :class="[
              getCellInfo(timeSlices, idx).role,
              { pending: isPending('time', idx) }
            ]"
            @click="
              getCellInfo(timeSlices, idx).role === 'empty'
                ? onCellClick('time', idx)
                : onSliceClick('time', getCellInfo(timeSlices, idx).sliceId!)
            "
          >
            <div class="slice-visual">
              <!-- 竖线（中间段） -->
              <div
                v-if="getCellInfo(timeSlices, idx).role === 'middle'"
                class="bar"
              />
              <!-- 起点/终点的半截 bar -->
              <div
                v-if="needTopBar(timeSlices, idx)"
                class="bar half-bar top"
              />
              <div
                v-if="needBottomBar(timeSlices, idx)"
                class="bar half-bar bottom"
              />
              <!-- 端点圆点 -->
              <div
                v-if="
                  getCellInfo(timeSlices, idx).role === 'start' ||
                  getCellInfo(timeSlices, idx).role === 'end'
                "
                class="dot"
              />
              <!-- 空位 -->
              <div
                v-if="getCellInfo(timeSlices, idx).role === 'empty'"
                class="empty-dot"
              />
            </div>
          </td>

          <!-- 样式 slice 列 -->
          <td
            class="cell-slice"
            :class="[
              getCellInfo(styleSlices, idx).role,
              { pending: isPending('style', idx) }
            ]"
            @click="
              getCellInfo(styleSlices, idx).role === 'empty'
                ? onCellClick('style', idx)
                : onSliceClick('style', getCellInfo(styleSlices, idx).sliceId!)
            "
          >
            <div class="slice-visual">
              <div
                v-if="getCellInfo(styleSlices, idx).role === 'middle'"
                class="bar"
              />
              <div
                v-if="needTopBar(styleSlices, idx)"
                class="bar half-bar top"
              />
              <div
                v-if="needBottomBar(styleSlices, idx)"
                class="bar half-bar bottom"
              />
              <div
                v-if="
                  getCellInfo(styleSlices, idx).role === 'start' ||
                  getCellInfo(styleSlices, idx).role === 'end'
                "
                class="dot"
              />
              <div
                v-if="getCellInfo(styleSlices, idx).role === 'empty'"
                class="empty-dot"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 提示 -->
    <div class="hint">
      <span v-if="pendingFrom">
        已选择 {{ stations[pendingFrom.rowIdx]?.name }}，请点击另一个站点完成创建
      </span>
      <span v-else>点击空位开始创建片段，点击已有片段删除</span>
    </div>
  </div>
</SideBar>
</template>

<style scoped>
.slice-editor {
  padding: 12px;
  user-select: none;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th,
td {
  text-align: center;
}

.col-station {
  width: 80px;
}

.col-slice {
  width: 60px;
}

.cell-station {
  font-size: 14px;
}

.cell-slice {
  height: 40px;
  padding: 0;
  cursor: pointer;
  position: relative;
  transition: 0.15s;
}

.cell-slice.empty:hover {
  background: #f0f0f0;
}

.cell-slice.pending {
  background: #e3f2fd;
}

.cell-slice.start,
.cell-slice.middle,
.cell-slice.end {
  cursor: pointer;
}

.cell-slice.start:hover,
.cell-slice.middle:hover,
.cell-slice.end:hover {
  background: #ffebee;
}

.slice-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;
}

/* 中间竖线 */
.bar {
  width: 4px;
  height: 100%;
  background: #2196f3;
  position: absolute;
}

/* 起点/终点的半截 bar */
.bar.half-bar {
  height: 50%;
}

.bar.half-bar.top {
  top: 0;
}

.bar.half-bar.bottom {
  bottom: 0;
}

/* 端点圆点 */
.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #2196f3;
  z-index: 1;
}

/* 空位小圆 */
.empty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: transparent;
}

.cell-slice.empty:hover .empty-dot {
  border-color: #2196f3;
}

/* 样式列用不同颜色 */
td:nth-child(3) .bar {
  background: #4caf50;
}

td:nth-child(3) .dot {
  background: #4caf50;
}

td:nth-child(3) .empty-dot:hover {
  border-color: #4caf50;
}

.hint {
  margin-top: 12px;
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style>
