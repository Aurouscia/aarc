<script setup lang="ts">
import SideBar from '@/components/common/SideBar.vue';
import { Line, LineStyle, StyleSlice, TimeSlice } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';
import { SliceType, useLineSliceStore } from '@/models/stores/lineSliceStore';
import { computed, ref, useTemplateRef } from 'vue';
import LineSliceList from './LineSliceList.vue';
import StyleSliceEditor from './StyleSliceEditor.vue';
import TimeSliceEditor from './TimeSliceEditor.vue';

const props = defineProps<{
    line: Line
}>()

const sidebar = useTemplateRef('sidebar')
const saveStore = useSaveStore()
const lineSliceStore = useLineSliceStore()

const editingSlice = ref<{
    type: SliceType
    id: number
}>()

defineExpose({
    open: () => { sidebar.value?.extend() },
    fold: () => { sidebar.value?.fold() }
})

const lineStyles = computed<LineStyle[]>(() => {
    return saveStore.save?.lineStyles?.map(x => {
        const copy = { ...x }
        if (!copy.name) {
            copy.name = '未命名样式'
        }
        return copy
    }) || []
})

const styleSlices = computed<StyleSlice[]>(() =>
    saveStore.save?.styleSlices?.filter(s => s.line === props.line.id) || []
)

const timeSlices = computed<TimeSlice[]>(() =>
    saveStore.save?.timeSlices?.filter(s => s.line === props.line.id) || []
)

const editingStyleSlice = computed<StyleSlice | undefined>(() => {
    if (editingSlice.value?.type !== 'style') return undefined
    return styleSlices.value.find(s => s.id === editingSlice.value!.id)
})

const editingTimeSlice = computed<TimeSlice | undefined>(() => {
    if (editingSlice.value?.type !== 'time') return undefined
    return timeSlices.value.find(s => s.id === editingSlice.value!.id)
})

function onEdit(sliceId: number, type: SliceType) {
    editingSlice.value = { type, id: sliceId }
}

function onDelete(sliceId: number, type: SliceType) {
    if (window.confirm('确认删除该片段？')) {
        lineSliceStore.deleteSlice(sliceId, type)
        if (editingSlice.value?.id === sliceId && editingSlice.value?.type === type) {
            editingSlice.value = undefined
        }
    }
}

function onEditorDone() {
    editingSlice.value = undefined
}
</script>

<template>
<SideBar ref="sidebar">
    <div class="options">
        <h2>样式片段</h2>
        <LineSliceList :slices="styleSlices" type="style" :line-styles="lineStyles"
            @edit="id => onEdit(id, 'style')"
            @delete="id => onDelete(id, 'style')" />
        <StyleSliceEditor v-if="editingStyleSlice" :slice="editingStyleSlice" @done="onEditorDone" />

        <h2>时间片段</h2>
        <LineSliceList :slices="timeSlices" type="time"
            @edit="id => onEdit(id, 'time')"
            @delete="id => onDelete(id, 'time')" />
        <TimeSliceEditor v-if="editingTimeSlice" :slice="editingTimeSlice" @done="onEditorDone" />
    </div>
</SideBar>
</template>

<style scoped lang="scss">
.options{
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    h2{
        font-size: 14px;
        margin: 0;
        color: #555;
        border-bottom: 1px solid #ddd;
        padding-bottom: 4px;
    }
}
</style>
