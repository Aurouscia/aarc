<script setup lang="ts">
import { ref } from 'vue';
import Lines from './sidebars/sideList/Lines.vue';
import Terrains from './sidebars/sideList/Terrains.vue';
import SizeEdit from './sidebars/SizeEdit.vue';
import ExportPng from './sidebars/ExportPng.vue';
import LocalConfigs from './sidebars/LocalConfigs.vue';
import { useEnvStore } from '@/models/stores/envStore';

defineProps<{
    preventingLeaving:boolean
}>()
const lines = ref<InstanceType<typeof Lines>>()
const terrains = ref<InstanceType<typeof Terrains>>()
const sizeEdit = ref<InstanceType<typeof Terrains>>()
const exportPng = ref<InstanceType<typeof ExportPng>>()
const localConfigs = ref<InstanceType<typeof LocalConfigs>>()
const envStore = useEnvStore()

type SidebarNames = 'lines'|'terrains'|'sizeEdit'|'exportPng'|'localConfigs'|undefined
const activeSidebarName = ref<SidebarNames>()

function openSidebarOf(name:SidebarNames){
    activeSidebarName.value = name
    if(name==='lines')
        lines.value?.comeOut()
    else
        lines.value?.fold()
    if(name==='terrains')
        terrains.value?.comeOut()
    else
        terrains.value?.fold()
    if(name==='sizeEdit')
        sizeEdit.value?.comeOut()
    else
        sizeEdit.value?.fold()
    if(name==='exportPng')
        exportPng.value?.comeOut()
    else
        exportPng.value?.fold()
    if(name==='localConfigs')
        localConfigs.value?.comeOut()
    else
        localConfigs.value?.fold()
}
function saveData(){
    emit('saveData')
}
const emit = defineEmits<{
    (e:'saveData'):void
}>()
</script>

<template>
    <div class="menu">
        <div @click="openSidebarOf('lines')" class="sqrBtn withShadow">线路</div>
        <div @click="openSidebarOf('terrains')" class="sqrBtn withShadow">地形</div>
        <div @click="envStore.createTextTag()" class="sqrBtn withShadow">标签</div>
        <div @click="openSidebarOf('sizeEdit')" class="sqrBtn withShadow">画布</div>
        <div @click="openSidebarOf('localConfigs')" class="sqrBtn withShadow">设置</div>
        <div @click="openSidebarOf('exportPng')" class="sqrBtn withShadow">导出</div>
        <div @click="saveData" class="sqrBtn withShadow saveBtn">
            <div v-show="preventingLeaving" class="saveRedDot"></div>
            保存
        </div>
    </div>
    <Lines ref="lines"></Lines>
    <Terrains ref="terrains"></Terrains>
    <SizeEdit ref="sizeEdit"></SizeEdit>
    <ExportPng ref="exportPng"></ExportPng>
    <LocalConfigs ref="localConfigs"></LocalConfigs>
</template>

<style scoped lang="scss">
.menu{
    z-index: 1002;
    position: fixed;
    bottom: 5px;
    left: 5px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    .sqrBtn{
        width: 36px;
        height: 36px;
        line-height: 36px;
        font-size: 14px;
    }
}
.saveBtn{
    color: white;
    background-color: olivedrab;
    position: relative;
    &:hover{
        background-color: green;
    }
    .saveRedDot{
        width: 12px;
        height: 12px;
        border-radius: 1000px;
        box-sizing: border-box;
        background-color: red;
        border: 2px solid white;
        position: absolute;
        right: -6px;
        top: -6px;
    }
}
</style>