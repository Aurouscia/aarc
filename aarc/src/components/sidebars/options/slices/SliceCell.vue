<script setup lang="ts">
import { AnySlice, SliceKind } from '@/models/save';
import { useSliceResolverStore } from '@/models/stores/saveDerived/slice/sliceResolverStore';
import { CellInfo, needTopBar as needTopBarPure, needBottomBar as needBottomBarPure } from './sliceEditor';

const props = defineProps<{
    cellInfo: CellInfo
    slices: AnySlice[]
    col: SliceKind
    stationIdx: number
    isPending: boolean
    isEditing: boolean
    isResizingFlashing: boolean
    isFirstRow: boolean
    isLastRow: boolean
}>()



const emit = defineEmits<{
    click: [event: MouseEvent]
    create: []
}>()

const sliceResolverStore = useSliceResolverStore()

function needTopBar(): boolean {
    const map = props.col === 'time' ? sliceResolverStore.timeSliceIndices : sliceResolverStore.styleSliceIndices
    return needTopBarPure(props.slices, map, props.stationIdx)
}

function needBottomBar(): boolean {
    const map = props.col === 'time' ? sliceResolverStore.timeSliceIndices : sliceResolverStore.styleSliceIndices
    return needBottomBarPure(props.slices, map, props.stationIdx)
}
</script>

<template>
  <td
    class="cell-slice"
    :class="[
      cellInfo.role,
      props.col,
      { pending: isPending },
      { editing: isEditing },
      { 'resizing-fixed': isResizingFlashing }
    ]"
    @click="emit('click', $event)"
  >
    <div class="slice-visual">
      <div
        v-if="cellInfo.role === 'middle' || cellInfo.role === 'startAndEnd'"
        class="bar"
      />
      <div
        v-if="needTopBar()"
        class="bar half-bar top"
      />
      <div
        v-if="needBottomBar()"
        class="bar half-bar bottom"
      />
      <div
        v-if="cellInfo.isStartOrEnd"
        class="dot"
      />
      <div
        v-if="cellInfo.role === 'empty'"
        class="plus-dot"
      />
      <div
        v-if="cellInfo.isPureStartOrEnd && !isFirstRow && !isLastRow"
        class="plus-dot create-dot"
        @click.stop="emit('create')"
        title="从此处开始创建"
      />
    </div>
  </td>
</template>

<style scoped lang="scss">
.cell-slice {
  height: 40px;
  padding: 0;
  cursor: pointer;
  position: relative;
  transition: 0.15s;

  &.empty:hover {
    background: #f0f0f0;
  }

  &.start, &.middle, &.end, &.startAndEnd {
    cursor: pointer;
  }
}

.slice-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;
}

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

.plus-dot {
  width: 28px;
  height: 28px;
  position: relative;
  cursor: pointer;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: #ccc;
    border-radius: 1px;
  }

  /* 竖线：视觉尺寸 14px，居中 */
  &::before {
    width: 2px;
    height: 14px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  /* 横线：视觉尺寸 14px，居中 */
  &::after {
    width: 14px;
    height: 2px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
}

.create-dot {
  position: absolute;
  right: 2px;

  &:hover::before,
  &:hover::after {
    background: #2196f3;
  }
}

/* ========== 时间列色系（蓝色系） ========== */
.cell-slice.time {
  .bar, .dot {
    background: #2196f3;
  }

  &:hover .plus-dot:not(.create-dot)::before,
  &:hover .plus-dot:not(.create-dot)::after {
    background: #2196f3;
  }

  .create-dot:hover::before,
  .create-dot:hover::after {
    background: #2196f3;
  }

  &.pending {
    .plus-dot::before,
    .plus-dot::after {
      background: #2196f3;
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

/* ========== 样式列色系（绿色系） ========== */
.cell-slice.style {
  .bar, .dot {
    background: #4caf50;
  }

  &:hover .plus-dot:not(.create-dot)::before,
  &:hover .plus-dot:not(.create-dot)::after {
    background: #4caf50;
  }

  .create-dot:hover::before,
  .create-dot:hover::after {
    background: #4caf50;
  }

  &.pending {
    .plus-dot::before,
    .plus-dot::after {
      background: #4caf50;
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

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
