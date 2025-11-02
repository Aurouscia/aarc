<script setup lang="ts">
import { Line } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { AuColorPicker } from '@aurouscia/au-color-picker';
import { CSSProperties, ref } from 'vue';

const envStore = useEnvStore()
const picker = ref<InstanceType<typeof AuColorPicker>>()
defineProps<{
    line:Line,
    zIndex?:number,
    entryStyles?:CSSProperties
}>()
defineExpose({
    close:()=>picker.value?.closePanel(),
    enforceTo:(hex:string)=>picker.value?.enforceTo(hex)
})
const emit = defineEmits<{
    (e:'colorUpdated'):void
}>()
</script>

<template>
    <AuColorPicker v-model="line.color"
        @done="()=>{emit('colorUpdated');envStore.lineInfoChanged(line)}"
        ref="picker" :panel-base-z-index="zIndex"
        :show-package-name="true"
        :entry-respond-delay="1"
        :panel-click-stop-propagation="true"
        :entry-styles="entryStyles"></AuColorPicker>
</template>