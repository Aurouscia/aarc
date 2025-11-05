<script setup lang="ts">
import { Line } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { AuColorPickerPresetsNested } from '@aurouscia/au-color-picker';
import { CSSProperties, ref, watch } from 'vue';
import { useColorPresetNames } from '../sideList/shared/useColorPresetNames';

const envStore = useEnvStore()
const picker = ref<InstanceType<typeof AuColorPickerPresetsNested>>()
const props = defineProps<{
    line:Line,
    zIndex?:number,
    entryStyles?:CSSProperties
}>()

const { getPresetNameByEnum, getPresetEnumByName, presets } = useColorPresetNames()

const colorPreNameSelected = ref<string>()
function initPreName(){
    colorPreNameSelected.value = getPresetNameByEnum(props.line.colorPre)
}
initPreName() //组件创建时初始化一次（不能在beforeMount中调用，否则会触发重新渲染）
watch(()=>props.line.id, initPreName) //线路更换时初始化一次

watch(()=>colorPreNameSelected.value, (presetName:string|undefined)=>{
    props.line.colorPre = getPresetEnumByName(presetName)
    window.setTimeout(()=>{
        envStore.lineInfoChanged(props.line)
    },1)
})
watch(()=>props.line.color, ()=>{
    if(!props.line.colorPre){
        envStore.lineInfoChanged(props.line)
    }
})
defineExpose({
    close:()=>picker.value?.closePanel()
})
</script>

<template>
    <AuColorPickerPresetsNested
        v-model="line.color"
        v-model:model-value-selected-preset="colorPreNameSelected"
        :presets="presets"
        :initial-selected-preset="getPresetNameByEnum(line.colorPre)"
        :show-package-name="true"
        :entry-respond-delay="1"
        ref="picker" :panel-base-z-index="zIndex"
        :panel-click-stop-propagation="true"
        :entry-styles="entryStyles"
        ></AuColorPickerPresetsNested>
</template>