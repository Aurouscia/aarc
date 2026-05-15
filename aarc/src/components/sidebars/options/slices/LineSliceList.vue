<script setup lang="ts">
import { LineSliceBase, LineStyle, StyleSlice, TimeSlice } from '@/models/save';
import { useStaClusterStore } from '@/models/stores/saveDerived/staClusterStore';
import { SliceType } from '@/models/stores/lineSliceStore';
import { computed } from 'vue';

const props = defineProps<{
    slices: LineSliceBase[]
    type: SliceType
    lineStyles?: LineStyle[]
}>()

const emit = defineEmits<{
    (e: 'edit', sliceId: number): void
    (e: 'delete', sliceId: number): void
}>()

const staClusterStore = useStaClusterStore()

function getPtName(ptId: number) {
    return staClusterStore.getStaName(ptId) || `点#${ptId}`
}

function getStyleName(styleId: number | undefined) {
    if (styleId === undefined) return '未设置样式'
    const style = props.lineStyles?.find(s => s.id === styleId)
    return style?.name || `样式#${styleId}`
}

const sortedSlices = computed(() => {
    return [...props.slices].sort((a, b) => a.fromPt - b.fromPt)
})
</script>

<template>
<div class="sliceList">
    <div v-if="slices.length === 0" class="emptyHint">
        暂无片段
    </div>
    <div v-for="slice in sortedSlices" :key="slice.id" class="sliceItem">
        <div class="sliceInfo" @click="emit('edit', slice.id)">
            <span class="ptRange">{{ getPtName(slice.fromPt) }} — {{ getPtName(slice.toPt) }}</span>
            <span v-if="type === 'style'" class="sliceTag styleTag">
                {{ getStyleName((slice as StyleSlice).style) }}
            </span>
            <span v-else class="sliceTag timeTag">
                {{ (slice as TimeSlice).time?.open ? '已设时间' : '未设时间' }}
            </span>
        </div>
        <button class="delBtn" @click="emit('delete', slice.id)">×</button>
    </div>
</div>
</template>

<style scoped lang="scss">
.sliceList{
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.emptyHint{
    color: #999;
    font-size: 12px;
    text-align: center;
    padding: 8px;
}
.sliceItem{
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    background-color: #f5f5f5;
    border-radius: 4px;
    .sliceInfo{
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        cursor: pointer;
        .ptRange{
            font-size: 13px;
            color: #333;
        }
        .sliceTag{
            font-size: 11px;
            padding: 1px 6px;
            border-radius: 3px;
            width: fit-content;
            &.styleTag{
                background-color: #e3f2fd;
                color: #1976d2;
            }
            &.timeTag{
                background-color: #fff3e0;
                color: #e65100;
            }
        }
    }
    .delBtn{
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        color: #999;
        font-size: 18px;
        cursor: pointer;
        &:hover{
            color: #f44336;
        }
    }
}
</style>
