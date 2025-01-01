<script setup lang="ts">
import { ref } from 'vue';
import Lines from './sideList/Lines.vue';
import Terrains from './sideList/Terrains.vue';
import SizeEdit from './SizeEdit.vue';
import ExportPng from './ExportPng.vue';

const lines = ref<InstanceType<typeof Lines>>()
const terrains = ref<InstanceType<typeof Terrains>>()
const sizeEdit = ref<InstanceType<typeof Terrains>>()
const exportPng = ref<InstanceType<typeof ExportPng>>()

type SidebarNames = 'lines'|'terrains'|'sizeEdit'|'exportPng'|undefined
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
        <div @click="openSidebarOf('sizeEdit')" class="sqrBtn withShadow">画布</div>
        <div @click="openSidebarOf('exportPng')" class="sqrBtn withShadow">导出</div>
        <div @click="saveData" class="sqrBtn withShadow saveBtn">保存</div>
    </div>
    <Lines ref="lines"></Lines>
    <Terrains ref="terrains"></Terrains>
    <SizeEdit ref="sizeEdit"></SizeEdit>
    <ExportPng ref="exportPng"></ExportPng>
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
    &:hover{
        background-color: green;
    }
}
</style>