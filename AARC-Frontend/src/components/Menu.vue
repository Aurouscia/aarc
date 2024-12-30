<script setup lang="ts">
import { ref } from 'vue';
import Lines from './sideList/Lines.vue';
import Terrains from './sideList/Terrains.vue';

const lines = ref<InstanceType<typeof Lines>>()
const terrains = ref<InstanceType<typeof Terrains>>()

type SidebarNames = 'lines'|'terrains'|undefined
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
        <div @click="openSidebarOf('lines')" class="sqrBtn withShadow">线</div>
        <div @click="openSidebarOf('terrains')" class="sqrBtn withShadow">地</div>
        <div @click="saveData" class="sqrBtn withShadow">存</div>
    </div>
    <Lines ref="lines"></Lines>
    <Terrains ref="terrains"></Terrains>
</template>

<style scoped lang="scss">
.menu{
    z-index: 1002;
    position: fixed;
    bottom: 5px;
    left: 5px;
    display: flex;
    flex-direction: column;
    gap: 10px
}
</style>