<script setup lang="ts">
import { TimeSlice } from '@/models/save';
import { useLineSliceStore } from '@/models/stores/lineSliceStore';
import { usePreventLeavingUnsavedStore } from '@/utils/eventUtils/preventLeavingUnsaved';
import { fromYMD, toYMD } from '@/utils/timeUtils/timeStr';
import { ref, watch } from 'vue';

const props = defineProps<{
    slice: TimeSlice
}>()

const emit = defineEmits<{
    (e: 'done'): void
}>()

const lineSliceStore = useLineSliceStore()
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
    lineSliceStore.updateSliceTime(props.slice.id, {
        ...props.slice.time,
        open: openTime
    })
}

watch(() => props.slice, () => {
    syncFrom()
}, { immediate: true })

function confirm() {
    syncTo()
    emit('done')
}
</script>

<template>
<div class="editor">
    <div class="editorTitle">编辑时间片段</div>
    <table class="fullWidth"><tbody>
        <tr>
            <td>建成</td>
            <td>
                <input v-model.lazy="translated.open" placeholder="YYYY-MM-DD" @blur="confirm"/>
            </td>
        </tr>
    </tbody></table>
    <div class="smallNote" style="margin-top: 4px;">
        可填写：2015 / 2015-3 / 2015-3-15
    </div>
</div>
</template>

<style scoped lang="scss">
.editor{
    padding: 8px;
    background-color: #fff3e0;
    border-radius: 4px;
    margin-top: 4px;
    .editorTitle{
        font-size: 12px;
        color: #e65100;
        margin-bottom: 6px;
    }
    input{
        width: 100%;
        padding: 4px;
    }
}
</style>
