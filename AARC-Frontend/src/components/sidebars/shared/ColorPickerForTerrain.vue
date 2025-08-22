<script setup lang="ts">
import { Line } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { AuColorPickerPresetsNested } from '@aurouscia/au-color-picker';
import { ref } from 'vue';
import { useColorPresetNames } from '../sideList/shared/useColorPresetNames';

const envStore = useEnvStore()
const picker = ref<InstanceType<typeof AuColorPickerPresetsNested>>()

const { getPresetNameByEnum, getPresetEnumByName, presets } = useColorPresetNames()

function colorPreChanged(presetName:string|undefined){
    props.line.colorPre = getPresetEnumByName(presetName)
    window.setTimeout(()=>{
        envStore.lineInfoChanged(props.line)
    },1)
}
function colorPickerDone(c:string){
    props.line.color = c
    if(!props.line.colorPre)
        envStore.lineInfoChanged(props.line)
}

const props = defineProps<{
    line:Line,
    zIndex:number
}>()
defineExpose({
    close:()=>picker.value?.closePanel()
})
</script>

<template>
    <AuColorPickerPresetsNested
        :initial="line.color"
        :presets="presets"
        :initial-selected-preset="getPresetNameByEnum(line.colorPre)"
        @preset-switched="n=>colorPreChanged(n)"
        @done="c=>colorPickerDone(c)"
        :show-package-name="true"
        :entry-respond-delay="1"
        ref="picker" :panel-base-z-index="zIndex"
        :panel-click-stop-propagation="true"
        ></AuColorPickerPresetsNested>
</template>