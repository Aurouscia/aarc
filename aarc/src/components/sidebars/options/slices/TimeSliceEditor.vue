<script setup lang="ts">
import { TimeSlice } from '@/models/save';
import { useSaveStore } from '@/models/stores/saveStore';
import { usePreventLeavingUnsavedStore } from '@/utils/eventUtils/preventLeavingUnsaved';
import { fromYMD, toYMD } from '@/utils/timeUtils/timeStr';
import { ref, watch } from 'vue';

const props = defineProps<{
    slice: TimeSlice
}>()

const emit = defineEmits<{
    (e: 'change'): void
}>()

const saveStore = useSaveStore()
const { preventLeaving } = usePreventLeavingUnsavedStore()

const translated = ref<{
    open?: string
}>({})

function syncFrom() {
    const t = props.slice.time
    translated.value = {
        open: toYMD(t?.open)
    }
}

function syncTo() {
    preventLeaving()
    const openTime = fromYMD(translated.value?.open)
    if (!saveStore.save?.timeSlices) return
    const slice = saveStore.save.timeSlices.find(s => s.id === props.slice.id)
    if (slice) {
        slice.time = {
            ...props.slice.time,
            open: openTime
        }
    }
}

watch(() => props.slice, () => {
    syncFrom()
}, { immediate: true })

function blur() {
    syncTo()
    emit('change')
}
</script>

<template>
<div class="editor">
    <div class="editorTitle">编辑时间片段</div>
    <table class="fullWidth"><tbody>
        <tr>
            <td>建成</td>
            <td>
                <input v-model.lazy="translated.open" placeholder="YYYY-MM-DD" @blur="blur"/>
            </td>
        </tr>
    </tbody></table>
    <div class="smallNote" style="margin-top: 4px;">
        可填写：2015 / 2015-3 / 2015-3-15
    </div>
    <div class="smallNote" style="margin-top: 4px;">
        抱歉：当前未开通站点颜色可能显示异常
    </div>
</div>
</template>

<style scoped lang="scss">
.editor{
    padding: 8px;
    border-radius: 4px;
    margin-top: 4px;
    .editorTitle{
        text-align: center;
        font-size: 14px;
        margin-bottom: 6px;
    }
    input{
        display: block;
        padding: 4px;
        width: 120px;
    }
    td{
        white-space: nowrap;
    }
}
</style>
