<script setup lang="ts">
import { Line } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { AuColorPicker } from '@aurouscia/au-color-picker';
import { ref } from 'vue';

const envStore = useEnvStore()
const picker = ref<InstanceType<typeof AuColorPicker>>()
defineProps<{
    line:Line,
    zIndex?:number
}>()
defineExpose({
    close:()=>picker.value?.closePanel()
})
</script>

<template>
    <AuColorPicker :initial="line.color"
        @done="c=>{line.color=c;envStore.lineInfoChanged(line)}"
        ref="picker" :panel-base-z-index="zIndex"
        :show-package-name="true"
        :entry-respond-delay="1"
        :panel-click-stop-propagation="true"></AuColorPicker>
</template>