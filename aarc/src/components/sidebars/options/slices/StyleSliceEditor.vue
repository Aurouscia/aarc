<script setup lang="ts">
import { LineStyle, StyleSlice } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';
import { useLineSliceStore } from '@/models/stores/lineSliceStore';
import { computed } from 'vue';

const props = defineProps<{
    slice: StyleSlice
}>()

const emit = defineEmits<{
    (e: 'done'): void
}>()

const saveStore = useSaveStore()
const lineSliceStore = useLineSliceStore()

const selectableLineStyles = computed<LineStyle[]>(() => {
    return saveStore.save?.lineStyles?.map(x => {
        const copy = { ...x }
        if (!copy.name) {
            copy.name = '未命名样式'
        }
        return copy
    }) || []
})

const selectedStyleId = computed({
    get: () => props.slice.style,
    set: (val: number) => {
        lineSliceStore.updateSliceStyle(props.slice.id, val)
    }
})

function confirm() {
    emit('done')
}
</script>

<template>
<div class="editor">
    <div class="editorTitle">编辑样式片段</div>
    <select v-model.number="selectedStyleId" @change="confirm">
        <option v-for="style in selectableLineStyles" :value="style.id" :key="style.id">
            {{ style.name }}
        </option>
    </select>
</div>
</template>

<style scoped lang="scss">
.editor{
    padding: 8px;
    border-radius: 4px;
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    .editorTitle{
        text-align: center;
        font-size: 14px;
        margin-bottom: 6px;
    }
    select{
        width: 100%;
        padding: 4px;
    }
}
</style>
