<script setup lang="ts">
import SideBar from '@/components/common/SideBar.vue';
import { Line, StyleSlice, TimeSlice } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';
import { useStaClusterStore } from '@/models/stores/saveDerived/staClusterStore';
import { computed, ref, useTemplateRef, watch } from 'vue'
import TimeSliceEditor from './TimeSliceEditor.vue';
import StyleSliceEditor from './StyleSliceEditor.vue';

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

/** 将 slice 的 fromPt/toPt（点ID）转换为在站点列表中的索引
 * startIdx: 索引较小的（表格中靠上的）
 * endIdx: 索引较大的（表格中靠下的）
 */
function getSliceIndices(slice: TimeSlice | StyleSlice): { startIdx: number, endIdx: number } | undefined {
    const fromIdx = props.line.pts.indexOf(slice.fromPt)
    const toIdx = props.line.pts.indexOf(slice.toPt)
    if (fromIdx === -1 || toIdx === -1) return undefined
    return { startIdx: Math.min(fromIdx, toIdx), endIdx: Math.max(fromIdx, toIdx) }
}

function getCellInfo(slices: (TimeSlice | StyleSlice)[], rowIdx: number): CellInfo {
    for (const slice of slices) {
        const indices = getSliceIndices(slice)
        if (!indices) continue
        const min = Math.min(indices.startIdx, indices.endIdx)
        const max = Math.max(indices.startIdx, indices.endIdx)
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
    return rowIdx === Math.max(indices.startIdx, indices.endIdx)
}

/** 判断某行单元格是否需要显示下半截 bar */
function needBottomBar(slices: (TimeSlice | StyleSlice)[], rowIdx: number): boolean {
    const info = getCellInfo(slices, rowIdx)
    if (info.role !== 'start' && info.role !== 'end') return false
    const slice = slices.find(s => s.id === info.sliceId)
    if (!slice) return false
    const indices = getSliceIndices(slice)
    if (!indices) return false
    return rowIdx === Math.min(indices.startIdx, indices.endIdx)
}

// ========== 创建新 Slice 的交互 ==========

const pendingFrom = ref<{ col: 'time' | 'style'; rowIdx: number } | null>(null)

function onCellClick(col: 'time' | 'style', rowIdx: number) {
    const slices = col === 'time' ? timeSlices.value : styleSlices.value
    const info = getCellInfo(slices, rowIdx)

    // 点击已有片段：取消 pending，不处理（由 onSliceCellClick 处理编辑）
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
        const sMin = Math.min(indices.startIdx, indices.endIdx)
        const sMax = Math.max(indices.startIdx, indices.endIdx)
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
            style: 0
        }
        saveStore.save!.styleSlices.push(newSlice)
    }

    pendingFrom.value = null
}

function isPending(col: 'time' | 'style', rowIdx: number): boolean {
    return pendingFrom.value?.col === col && pendingFrom.value?.rowIdx === rowIdx
}

// ========== 编辑 Slice ==========

const editingSlice = ref<{ type: 'time' | 'style'; id: number } | null>(null)

/** 重设端点状态：记录闪烁的点（要被替换的）和 slice 信息，等待用户选另一个点 */
const resizingSlice = ref<{
    type: 'time' | 'style'
    sliceId: number
    flashingRowIdx: number  // 闪烁的点（要被替换的）在站点列表中的索引
} | null>(null)

function onSliceCellClick(col: 'time' | 'style', rowIdx: number) {
    const slices = col === 'time' ? timeSlices.value : styleSlices.value
    const info = getCellInfo(slices, rowIdx)

    // 如果正在重设端点
    if (resizingSlice.value && resizingSlice.value.type === col) {
        // 点击当前正在编辑的 slice 内部（非闪烁端点）：允许作为新端点
        if (info.sliceId === resizingSlice.value.sliceId && rowIdx !== resizingSlice.value.flashingRowIdx) {
            doResizeSlice(col, resizingSlice.value.sliceId, resizingSlice.value.flashingRowIdx, rowIdx)
            resizingSlice.value = null
            return
        }
        // 点击空位：完成重设
        if (info.role === 'empty') {
            doResizeSlice(col, resizingSlice.value.sliceId, resizingSlice.value.flashingRowIdx, rowIdx)
            resizingSlice.value = null
            return
        }
        // 点击其他 slice 或闪烁端点自身：abort
        resizingSlice.value = null
        return
    }

    if (info.role === 'empty') {
        // 空位：走创建流程
        editingSlice.value = null
        onCellClick(col, rowIdx)
        return
    }

    if (info.sliceId) {
        // 已有 slice：切换编辑模式
        pendingFrom.value = null
        resizingSlice.value = null
        if (editingSlice.value?.type === col && editingSlice.value?.id === info.sliceId) {
            // 再点一下关闭
            editingSlice.value = null
        } else {
            editingSlice.value = { type: col, id: info.sliceId }
        }
    }
}

function isEditing(col: 'time' | 'style', rowIdx: number): boolean {
    const slices = col === 'time' ? timeSlices.value : styleSlices.value
    const info = getCellInfo(slices, rowIdx)
    if (!info.sliceId) return false
    return editingSlice.value?.type === col && editingSlice.value?.id === info.sliceId
}

/** 检查某行是否是重设端点时的闪烁点（要被替换的） */
function isResizingFlashing(col: 'time' | 'style', rowIdx: number): boolean {
    return resizingSlice.value?.type === col && resizingSlice.value?.flashingRowIdx === rowIdx
}

const editingTimeSlice = computed<TimeSlice | undefined>(() => {
    if (editingSlice.value?.type !== 'time') return undefined
    return timeSlices.value.find(s => s.id === editingSlice.value!.id)
})

const editingStyleSlice = computed<StyleSlice | undefined>(() => {
    if (editingSlice.value?.type !== 'style') return undefined
    return styleSlices.value.find(s => s.id === editingSlice.value!.id)
})

function deleteSlice(type: 'time' | 'style', sliceId: number) {
    if (!window.confirm('确认删除该片段？')) return
    const slices = type === 'time' ? saveStore.save?.timeSlices : saveStore.save?.styleSlices
    if (!slices) return
    const idx = slices.findIndex(s => s.id === sliceId)
    if (idx >= 0) {
        slices.splice(idx, 1)
    }
    editingSlice.value = null
    resizingSlice.value = null
    pendingFrom.value = null
}

/** 开始重设端点：闪烁要被替换的点，固定另一个点
 * whichEnd: 'top' 表示重设表格中靠前的点（索引小的）
 * whichEnd: 'bottom' 表示重设表格中靠后的点（索引大的）
 */
function startResize(type: 'time' | 'style', sliceId: number, whichEnd: 'top' | 'bottom') {
    const slices = type === 'time' ? timeSlices.value : styleSlices.value
    const slice = slices.find(s => s.id === sliceId)
    if (!slice) return
    const indices = getSliceIndices(slice)
    if (!indices) return

    // 'top' = 重设靠上的点，闪烁靠上的点（startIdx）
    // 'bottom' = 重设靠下的点，闪烁靠下的点（endIdx）
    const flashingRowIdx = whichEnd === 'top' ? indices.startIdx : indices.endIdx
    resizingSlice.value = { type, sliceId, flashingRowIdx }
}

/** 执行重设：修改 slice 的端点
 * flashingRowIdx: 原来闪烁的点（要被替换的）
 * newRowIdx: 用户点击的新点
 */
function doResizeSlice(type: 'time' | 'style', sliceId: number, flashingRowIdx: number, newRowIdx: number) {
    const slices = type === 'time' ? saveStore.save?.timeSlices : saveStore.save?.styleSlices
    if (!slices) return
    const slice = slices.find(s => s.id === sliceId)
    if (!slice) return

    const flashingPt = props.line.pts[flashingRowIdx]
    const newPt = props.line.pts[newRowIdx]

    // 检查新范围是否与现有其他 slice 重叠
    const allSlices = type === 'time' ? timeSlices.value : styleSlices.value
    const newMin = Math.min(flashingRowIdx, newRowIdx)
    const newMax = Math.max(flashingRowIdx, newRowIdx)
    const hasOverlap = allSlices.some(s => {
        if (s.id === sliceId) return false
        const indices = getSliceIndices(s)
        if (!indices) return false
        const sMin = Math.min(indices.startIdx, indices.endIdx)
        const sMax = Math.max(indices.startIdx, indices.endIdx)
        return !(newMax < sMin || newMin > sMax)
    })

    if (hasOverlap) {
        alert('与现有片段重叠')
        return
    }

    // 更新 slice：用新点替换闪烁的点
    if (flashingRowIdx === newRowIdx) {
        // 同一点，无效
        return
    }

    // 找到 slice 中原来等于闪烁点的那个端点，替换为新点
    if (slice.fromPt === flashingPt) {
        slice.fromPt = newPt
    } else if (slice.toPt === flashingPt) {
        slice.toPt = newPt
    }
}

// ========== Sidebar 收起时 abort ==========

watch(() => sidebar.value, (newVal) => {
    if (!newVal) return
    // SideBar 没有暴露 showing 状态，我们通过 fold 方法调用来处理
})

// 重写 fold 方法，在收起时 abort
function extend() {
    sidebar.value?.extend()
}
function fold() {
    resizingSlice.value = null
    pendingFrom.value = null
    sidebar.value?.fold()
}

// ========== 表格行数据结构 ==========

type RowType = 'data' | 'editor'

interface TableRow {
    type: RowType
    stationIdx: number  // 对应 stations 的索引
    editorType?: 'time' | 'style'
    editorSliceId?: number
}

const tableRows = computed<TableRow[]>(() => {
    const rows: TableRow[] = []
    for (let i = 0; i < stations.value.length; i++) {
        rows.push({ type: 'data', stationIdx: i })
        // 检查这一行后面是否需要插入编辑器行
        const timeInfo = getCellInfo(timeSlices.value, i)
        if (timeInfo.sliceId && editingSlice.value?.type === 'time' && editingSlice.value.id === timeInfo.sliceId) {
            // 找到这个 slice 的终点行，在终点行下方插入编辑器
            const slice = timeSlices.value.find(s => s.id === timeInfo.sliceId)
            if (slice) {
                const indices = getSliceIndices(slice)
                if (indices && i === Math.max(indices.startIdx, indices.endIdx)) {
                    rows.push({ type: 'editor', stationIdx: i, editorType: 'time', editorSliceId: timeInfo.sliceId })
                }
            }
        }
        const styleInfo = getCellInfo(styleSlices.value, i)
        if (styleInfo.sliceId && editingSlice.value?.type === 'style' && editingSlice.value.id === styleInfo.sliceId) {
            const slice = styleSlices.value.find(s => s.id === styleInfo.sliceId)
            if (slice) {
                const indices = getSliceIndices(slice)
                if (indices && i === Math.max(indices.startIdx, indices.endIdx)) {
                    rows.push({ type: 'editor', stationIdx: i, editorType: 'style', editorSliceId: styleInfo.sliceId })
                }
            }
        }
    }
    return rows
})

defineExpose({
    open: extend,
    fold: fold
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
        <template v-for="(row, rowIdx) in tableRows" :key="rowIdx">
          <!-- 数据行 -->
          <tr v-if="row.type === 'data'" :class="{ 'editing-row': isEditing('time', row.stationIdx) || isEditing('style', row.stationIdx) }">
            <!-- 站点名 -->
            <td class="cell-station">{{ stations[row.stationIdx].name }}</td>

            <!-- 时间 slice 列 -->
            <td
              class="cell-slice"
              :class="[
                getCellInfo(timeSlices, row.stationIdx).role,
                { pending: isPending('time', row.stationIdx) },
                { editing: isEditing('time', row.stationIdx) },
                { 'resizing-fixed': isResizingFlashing('time', row.stationIdx) }
              ]"
              @click="onSliceCellClick('time', row.stationIdx)"
            >
              <div class="slice-visual">
                <div
                  v-if="getCellInfo(timeSlices, row.stationIdx).role === 'middle'"
                  class="bar"
                />
                <div
                  v-if="needTopBar(timeSlices, row.stationIdx)"
                  class="bar half-bar top"
                />
                <div
                  v-if="needBottomBar(timeSlices, row.stationIdx)"
                  class="bar half-bar bottom"
                />
                <div
                  v-if="
                    getCellInfo(timeSlices, row.stationIdx).role === 'start' ||
                    getCellInfo(timeSlices, row.stationIdx).role === 'end'
                  "
                  class="dot"
                />
                <div
                  v-if="getCellInfo(timeSlices, row.stationIdx).role === 'empty'"
                  class="empty-dot"
                />
              </div>
            </td>

            <!-- 样式 slice 列 -->
            <td
              class="cell-slice"
              :class="[
                getCellInfo(styleSlices, row.stationIdx).role,
                { pending: isPending('style', row.stationIdx) },
                { editing: isEditing('style', row.stationIdx) },
                { 'resizing-fixed': isResizingFlashing('style', row.stationIdx) }
              ]"
              @click="onSliceCellClick('style', row.stationIdx)"
            >
              <div class="slice-visual">
                <div
                  v-if="getCellInfo(styleSlices, row.stationIdx).role === 'middle'"
                  class="bar"
                />
                <div
                  v-if="needTopBar(styleSlices, row.stationIdx)"
                  class="bar half-bar top"
                />
                <div
                  v-if="needBottomBar(styleSlices, row.stationIdx)"
                  class="bar half-bar bottom"
                />
                <div
                  v-if="
                    getCellInfo(styleSlices, row.stationIdx).role === 'start' ||
                    getCellInfo(styleSlices, row.stationIdx).role === 'end'
                  "
                  class="dot"
                />
                <div
                  v-if="getCellInfo(styleSlices, row.stationIdx).role === 'empty'"
                  class="empty-dot"
                />
              </div>
            </td>
          </tr>

          <!-- 编辑器行 -->
          <tr v-else-if="row.type === 'editor'" class="editor-row">
            <td colspan="3" class="editor-cell">
              <div v-if="row.editorType === 'time' && editingTimeSlice" class="editor-panel time">
                <TimeSliceEditor :slice="editingTimeSlice"/>
                <div v-if="resizingSlice?.sliceId === editingTimeSlice.id" class="resize-hint">
                  <span>请选择新{{ resizingSlice?.flashingRowIdx === getSliceIndices(editingTimeSlice)?.startIdx ? '上' : '下' }}点</span>
                  <button @click="resizingSlice = null">取消</button>
                </div>
                <div v-else class="editor-btns">
                  <button @click="startResize('time', editingTimeSlice.id, 'top')">重设上点</button>
                  <button @click="startResize('time', editingTimeSlice.id, 'bottom')">重设下点</button>
                  <button @click="deleteSlice('time', editingTimeSlice.id)" class="cancel">删除片段</button>
                </div>
              </div>
              <div v-if="row.editorType === 'style' && editingStyleSlice" class="editor-panel style">
                <StyleSliceEditor :slice="editingStyleSlice"/>
                <div v-if="resizingSlice?.sliceId === editingStyleSlice.id" class="resize-hint">
                  <span>请选择新{{ resizingSlice?.flashingRowIdx === getSliceIndices(editingStyleSlice)?.startIdx ? '上' : '下' }}点</span>
                  <button @click="resizingSlice = null">取消</button>
                </div>
                <div v-else class="editor-btns">
                  <button @click="startResize('style', editingStyleSlice.id, 'top')">重设上点</button>
                  <button @click="startResize('style', editingStyleSlice.id, 'bottom')">重设下点</button>
                  <button @click="deleteSlice('style', editingStyleSlice.id)" class="cancel">删除片段</button>
                </div>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <!-- 提示 -->
    <div class="hint">
      <span v-if="resizingSlice">
        已选择 {{ stations[resizingSlice.flashingRowIdx]?.name }}，请点击另一个空位完成重设
      </span>
      <span v-else-if="pendingFrom">
        已选择 {{ stations[pendingFrom.rowIdx]?.name }}，请点击另一个站点完成创建
      </span>
      <span v-else-if="editingSlice">
        编辑中，再次点击该片段可关闭
      </span>
      <span v-else>点击空位开始创建片段，点击已有片段编辑</span>
    </div>
  </div>
</SideBar>
</template>

<style scoped lang="scss">
.slice-editor {
  user-select: none;
}

table {
  border-collapse: collapse;
  width: 100%;

  th, td {
    text-align: center;
  }

  th {
    background-color: gray;
  }
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

  &.empty:hover {
    background: #f0f0f0;
  }

  &.start, &.middle, &.end {
    cursor: pointer;
  }
}

.editing-row {
  background: #fafafa;
}

.slice-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;
}

/* ========== 时间列色系（蓝色系） ========== */
td:nth-child(2) {
  .bar, .dot {
    background: #2196f3;
  }

  &.empty:hover .empty-dot {
    border-color: #2196f3;
  }

  &.pending {
    .empty-dot {
      border-color: #2196f3;
    }
  }

  &.editing {
    background: #bbdefb;
  }

  &.resizing-fixed {
    background: #90caf9;
    animation: pulse 1s infinite;
  }
}

.editor-panel.time {
  background: #bbdefb;
  &:deep(.editorTitle) {
    color: #2196f3;
  }
}

/* ========== 样式列色系（绿色系） ========== */
td:nth-child(3) {
  .bar, .dot {
    background: #4caf50;
  }

  &.empty:hover .empty-dot {
    border-color: #4caf50;
  }

  &.pending {
    .empty-dot {
      border-color: #4caf50;
    }
  }

  &.editing {
    background: #c8e6c9;
  }

  &.resizing-fixed {
    background: #a5d6a7;
    animation: pulse 1s infinite;
  }
}

.editor-panel.style {
  background: #c8e6c9;
  &:deep(.editorTitle) {
    color: #4caf50;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* ========== 通用样式 ========== */
.bar {
  width: 4px;
  height: 100%;
  position: absolute;

  &.half-bar {
    height: 50%;

    &.top {
      top: 0;
    }

    &.bottom {
      bottom: 0;
    }
  }
}

.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  z-index: 1;
}

.empty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #ccc;
  background: transparent;
}

.editor-row {
  background: #fafafa;
}

.editor-cell {
  padding: 0px;
  text-align: left;
}

.editor-panel {
  padding: 8px;
  border-radius: 4px;
}

.editor-btns {
  display: flex;
  margin-top: 8px;

  button {
    flex: 1;
  }
}

.resize-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.hint {
  margin-top: 12px;
  font-size: 12px;
  color: #666;
  text-align: center;
}
</style>
