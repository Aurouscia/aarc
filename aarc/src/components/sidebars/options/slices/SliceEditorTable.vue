<script setup lang="ts">
import SideBar from '@/components/common/SideBar.vue';
import { Line, TimeSlice, StyleSlice, AnySlice, SliceKind } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';
import { useStaClusterStore } from '@/models/stores/saveDerived/staClusterStore';
import { computed, ref, useTemplateRef, type Component, type ComputedRef } from 'vue'
import TimeSliceEditor from './TimeSliceEditor.vue';
import StyleSliceEditor from './StyleSliceEditor.vue';
import { useEnvStore } from '@/models/stores/envStore';
import { useSliceResolverStore } from '@/models/stores/saveDerived/slice/sliceResolverStore';
import {
    buildCellInfoMap,
    checkOverlap,
    computeSliceEndpoints,
    computeResizeEndpoints,
    isSharedBoundary as isSharedBoundaryPure,
    getSliceIdAtPosition as getSliceIdAtPositionPure,
    getSliceIndices,
    type CellInfo,
} from './sliceEditor';
import SliceCell from './SliceCell.vue';
import SliceEditorPanel from './SliceEditorPanel.vue';


const props = defineProps<{
    line: Line
}>()

const saveStore = useSaveStore()
const staClusterStore = useStaClusterStore()
const sliceResolverStore = useSliceResolverStore()
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

// ========== Slice 列配置 ==========

interface SliceColConfig {
    kind: SliceKind
    label: string
    slices: ComputedRef<AnySlice[]>
    cellInfoMap: ComputedRef<Map<number, CellInfo>>
    editorComponent: Component
    editingSlice: ComputedRef<AnySlice | undefined>
    panelClass: string
}

const timeSlices = computed<TimeSlice[]>(() =>
    saveStore.save?.timeSlices?.filter(s => s.line === props.line.id) || []
)

const styleSlices = computed<StyleSlice[]>(() =>
    saveStore.save?.styleSlices?.filter(s => s.line === props.line.id) || []
)

const timeCellInfoMap = computed(() =>
    buildCellInfoMap(timeSlices.value, sliceResolverStore.timeSliceIndices, stations.value.length)
)

const styleCellInfoMap = computed(() =>
    buildCellInfoMap(styleSlices.value, sliceResolverStore.styleSliceIndices, stations.value.length)
)

const editingSlice = ref<{ type: SliceKind; id: number } | null>(null)

const editingTimeSlice = computed<TimeSlice | undefined>(() => {
    if (editingSlice.value?.type !== 'time') return undefined
    return timeSlices.value.find(s => s.id === editingSlice.value!.id)
})

const editingStyleSlice = computed<StyleSlice | undefined>(() => {
    if (editingSlice.value?.type !== 'style') return undefined
    return styleSlices.value.find(s => s.id === editingSlice.value!.id)
})

const sliceCols: SliceColConfig[] = [
    {
        kind: 'time',
        label: '时间',
        slices: timeSlices,
        cellInfoMap: timeCellInfoMap,
        editorComponent: TimeSliceEditor,
        editingSlice: editingTimeSlice,
        panelClass: 'time',
    },
    {
        kind: 'style',
        label: '样式',
        slices: styleSlices,
        cellInfoMap: styleCellInfoMap,
        editorComponent: StyleSliceEditor,
        editingSlice: editingStyleSlice,
        panelClass: 'style',
    },
]

function getColConfig(kind: SliceKind): SliceColConfig {
    return sliceCols.find(c => c.kind === kind)!
}

function getCellInfoByCol(rowIdx: number, col: SliceKind): CellInfo {
    return getColConfig(col).cellInfoMap.value.get(rowIdx)!
}

// ========== 创建新 Slice 的交互 ==========

const pendingFrom = ref<{ col: SliceKind; rowIdx: number } | null>(null)

function onCellClick(col: SliceKind, rowIdx: number) {
    const info = getCellInfoByCol(rowIdx, col)

    // 点击 slice 中间：取消 pending，不能作为端点
    if (info.role === 'middle') {
        pendingFrom.value = null
        return
    }

    // 第一次点击有效位置（empty/start/end/startAndEnd）：记录起点
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

    const min = Math.min(fromIdx, toIdx)
    const max = Math.max(fromIdx, toIdx)

    // 检查是否与现有 slice 重叠
    const slices = col === 'time' ? timeSlices.value : styleSlices.value
    const sliceIndicesMap = col === 'time' ? sliceResolverStore.timeSliceIndices : sliceResolverStore.styleSliceIndices
    if (checkOverlap(slices, sliceIndicesMap, -1, min, max)) {
        alert('与现有片段重叠')
        pendingFrom.value = null
        return
    }

    // 创建：根据用户点击的索引位置计算正确的 fromPt/toPt 存储方式
    const endpoints = computeSliceEndpoints(props.line, fromIdx, toIdx)
    if (!endpoints) {
        alert('无法创建片段：端点解析歧义')
        pendingFrom.value = null
        return
    }
    const { fromPt, toPt } = endpoints

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

function isPending(col: SliceKind, rowIdx: number): boolean {
    return pendingFrom.value?.col === col && pendingFrom.value?.rowIdx === rowIdx
}

// ========== 编辑 Slice ==========

/** 重设端点状态：记录闪烁的点（要被替换的）和 slice 信息，等待用户选另一个点 */
const resizingSlice = ref<{
    type: SliceKind
    sliceId: number
    flashingRowIdx: number  // 闪烁的点（要被替换的）在站点列表中的索引
} | null>(null)

function isSharedBoundary(slices: AnySlice[], rowIdx: number, col: SliceKind): boolean {
    const map = col === 'time' ? sliceResolverStore.timeSliceIndices : sliceResolverStore.styleSliceIndices
    return isSharedBoundaryPure(slices, map, rowIdx)
}

function getSliceIdAtPosition(slices: AnySlice[], rowIdx: number, col: SliceKind, clickYRatio: number): number | undefined {
    const map = col === 'time' ? sliceResolverStore.timeSliceIndices : sliceResolverStore.styleSliceIndices
    return getSliceIdAtPositionPure(slices, map, rowIdx, clickYRatio)
}

function onSliceCellClick(event: MouseEvent, col: SliceKind, rowIdx: number) {
    const info = getCellInfoByCol(rowIdx, col)

    // 如果正在重设端点
    if (resizingSlice.value && resizingSlice.value.type === col) {
        // 点击闪烁端点自身：abort
        if (rowIdx === resizingSlice.value.flashingRowIdx) {
            resizingSlice.value = null
            return
        }
        // 其他情况：尝试重设（当前 slice 内部、空位、其他 slice 端点、共享边界等）
        doResizeSlice(col, resizingSlice.value.sliceId, resizingSlice.value.flashingRowIdx, rowIdx)
        resizingSlice.value = null
        rerenderIfSlicesChanged()
        return
    }

    // 创建模式优先：如果已有 pendingFrom，继续创建流程
    if (pendingFrom.value && pendingFrom.value.col === col) {
        if (pendingFrom.value.rowIdx === rowIdx) {
            // 点击同一点：取消创建
            pendingFrom.value = null
        } else {
            editingSlice.value = null
            onCellClick(col, rowIdx)
        }
        return
    }

    if (info.role === 'empty') {
        // 空位：走创建流程
        editingSlice.value = null
        onCellClick(col, rowIdx)
        return
    }

    // 确定要操作的 sliceId（共享边界根据点击位置选择）
    const slices = col === 'time' ? timeSlices.value : styleSlices.value
    let targetSliceId: number | undefined
    if (isSharedBoundary(slices, rowIdx, col)) {
        const target = event.currentTarget as HTMLElement
        const rect = target.getBoundingClientRect()
        const clickYRatio = (event.clientY - rect.top) / rect.height
        targetSliceId = getSliceIdAtPosition(slices, rowIdx, col, clickYRatio)
    } else {
        targetSliceId = info.sliceId
    }

    if (targetSliceId) {
        // 已有 slice：切换编辑模式
        pendingFrom.value = null
        resizingSlice.value = null
        if (editingSlice.value?.type === col && editingSlice.value?.id === targetSliceId) {
            // 再点一下关闭
            editingSlice.value = null
        } else {
            editingSlice.value = { type: col, id: targetSliceId }
        }
        rerenderIfSlicesChanged()
    }
}

function isEditing(col: SliceKind, rowIdx: number): boolean {
    if (editingSlice.value?.type !== col) return false
    const slices = col === 'time' ? timeSlices.value : styleSlices.value
    // 检查当前编辑的 slice 是否覆盖了这个点
    const editingSliceData = slices.find(s => s.id === editingSlice.value!.id)
    if (!editingSliceData) return false
    const indices = getSliceIndices(editingSliceData, col)
    if (!indices) return false
    return rowIdx >= indices.fromIdx && rowIdx <= indices.toIdx
}

/** 检查某行是否是重设端点时的闪烁点（要被替换的） */
function isResizingFlashing(col: SliceKind, rowIdx: number): boolean {
    return resizingSlice.value?.type === col && resizingSlice.value?.flashingRowIdx === rowIdx
}

function deleteSlice(type: SliceKind, sliceId: number) {
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
function startResize(type: SliceKind, sliceId: number, whichEnd: 'top' | 'bottom') {
    const slices = type === 'time' ? timeSlices.value : styleSlices.value
    const slice = slices.find(s => s.id === sliceId)
    if (!slice) return
    const indices = getSliceIndices(slice, type)
    if (!indices) return

    // 'top' = 重设靠上的点，闪烁靠上的点（fromIdx）
    // 'bottom' = 重设靠下的点，闪烁靠下的点（toIdx）
    const flashingRowIdx = whichEnd === 'top' ? indices.fromIdx : indices.toIdx
    resizingSlice.value = { type, sliceId, flashingRowIdx }
}

/** 执行重设：修改 slice 的端点
 * flashingRowIdx: 原来闪烁的点（要被替换的）
 * newRowIdx: 用户点击的新点
 */
function doResizeSlice(type: SliceKind, sliceId: number, flashingRowIdx: number, newRowIdx: number) {
    const slices = type === 'time' ? saveStore.save?.timeSlices : saveStore.save?.styleSlices
    if (!slices) return
    const slice = slices.find(s => s.id === sliceId)
    if (!slice) return

    // 更新 slice：用新点替换闪烁的点
    if (flashingRowIdx === newRowIdx) {
        // 同一点，无效
        return
    }

    // 获取当前解析结果，确定固定端点
    const currentIndices = getSliceIndices(slice, type)
    if (!currentIndices) return

    const isFlashingStart = flashingRowIdx === currentIndices.fromIdx
    const fixedRowIdx = isFlashingStart ? currentIndices.toIdx : currentIndices.fromIdx

    // 用户意图的新范围
    const userMin = Math.min(fixedRowIdx, newRowIdx)
    const userMax = Math.max(fixedRowIdx, newRowIdx)

    // 检查新范围是否与现有其他 slice 重叠
    const allSlices = type === 'time' ? timeSlices.value : styleSlices.value
    const sliceIndicesMap = type === 'time' ? sliceResolverStore.timeSliceIndices : sliceResolverStore.styleSliceIndices
    if (checkOverlap(allSlices, sliceIndicesMap, sliceId, userMin, userMax)) {
        alert('与现有片段重叠')
        return
    }

    // 计算新的端点存储方式
    const endpoints = computeResizeEndpoints(props.line, currentIndices, flashingRowIdx, newRowIdx)
    if (!endpoints) {
        alert('无法重设：端点解析歧义')
        return
    }
    slice.fromPt = endpoints.fromPt
    slice.toPt = endpoints.toPt
}

// ========== Sidebar 收起时 abort ==========

let initialTimeSlicesJson = ''
let initialStyleSlicesJson = ''

function onSideBarExtend() {
    initialTimeSlicesJson = JSON.stringify(timeSlices.value)
    initialStyleSlicesJson = JSON.stringify(styleSlices.value)
}

function rerenderIfSlicesChanged() {
    const currentTimeSlicesJson = JSON.stringify(timeSlices.value)
    const currentStyleSlicesJson = JSON.stringify(styleSlices.value)
    if (currentTimeSlicesJson !== initialTimeSlicesJson || currentStyleSlicesJson !== initialStyleSlicesJson) {
        useEnvStore().rerender([], [])
        initialTimeSlicesJson = currentTimeSlicesJson
        initialStyleSlicesJson = currentStyleSlicesJson
    }
}

function onSideBarFold() {
    resizingSlice.value = null
    pendingFrom.value = null
    rerenderIfSlicesChanged()
}

function extend() {
    sidebar.value?.extend()
}
function fold() {
    sidebar.value?.fold()
}

// ========== 表格行数据结构 ==========

type RowType = 'data' | 'editor'

interface TableRow {
    type: RowType
    stationIdx: number  // 对应 stations 的索引
    editorType?: SliceKind
    editorSliceId?: number
}

const tableRows = computed<TableRow[]>(() => {
    const rows: TableRow[] = []
    for (let i = 0; i < stations.value.length; i++) {
        rows.push({ type: 'data', stationIdx: i })
        // 检查这一行后面是否需要插入编辑器行
        for (const col of sliceCols) {
            const info = col.cellInfoMap.value.get(i)!
            if (info.sliceId && editingSlice.value?.type === col.kind && editingSlice.value.id === info.sliceId) {
                const slice = col.slices.value.find(s => s.id === info.sliceId)
                if (slice) {
                    const indices = getSliceIndices(slice, col.kind)
                    if (indices && i === indices.toIdx) {
                        rows.push({ type: 'editor', stationIdx: i, editorType: col.kind, editorSliceId: info.sliceId })
                    }
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
<SideBar ref="sidebar" @extend="onSideBarExtend" @fold="onSideBarFold">
  <div class="slice-editor">
    <table>
      <thead>
        <tr>
          <th class="col-station">站点</th>
          <th v-for="col in sliceCols" :key="col.kind" class="col-slice">{{ col.label }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(row, rowIdx) in tableRows" :key="rowIdx">
          <!-- 数据行 -->
          <tr v-if="row.type === 'data'" :class="{ 'editing-row': sliceCols.some(c => isEditing(c.kind, row.stationIdx)) }">
            <!-- 站点名 -->
            <td class="cell-station">{{ stations[row.stationIdx].name }}</td>

            <!-- slice 列 -->
            <SliceCell
              v-for="col in sliceCols"
              :key="col.kind"
              :cell-info="col.cellInfoMap.value.get(row.stationIdx)!"
              :slices="col.slices.value"
              :col="col.kind"
              :station-idx="row.stationIdx"
              :is-pending="isPending(col.kind, row.stationIdx)"
              :is-editing="isEditing(col.kind, row.stationIdx)"
              :is-resizing-flashing="isResizingFlashing(col.kind, row.stationIdx)"
              @click="onSliceCellClick($event, col.kind, row.stationIdx)"
              @create="onCellClick(col.kind, row.stationIdx)"
            />
          </tr>

          <!-- 编辑器行 -->
          <tr v-else-if="row.type === 'editor'" class="editor-row">
            <td :colspan="1 + sliceCols.length" class="editor-cell">
              <SliceEditorPanel
                v-if="row.editorType && getColConfig(row.editorType).editingSlice.value"
                :slice="getColConfig(row.editorType).editingSlice.value!"
                :col="row.editorType"
                :editor-component="getColConfig(row.editorType).editorComponent"
                :panel-class="getColConfig(row.editorType).panelClass"
                :resizing-slice-id="resizingSlice?.sliceId"
                :flashing-row-idx="resizingSlice?.flashingRowIdx"
                @change="rerenderIfSlicesChanged()"
                @resize-top="startResize(row.editorType, row.editorSliceId!, 'top')"
                @resize-bottom="startResize(row.editorType, row.editorSliceId!, 'bottom')"
                @delete="deleteSlice(row.editorType, row.editorSliceId!)"
                @cancel-resize="resizingSlice = null"
              />
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

.editing-row {
  background: #fafafa;
}

/* ========== 通用样式 ========== */

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
