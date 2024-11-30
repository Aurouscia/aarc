<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Lines from './sideList/Lines.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import Terrains from './sideList/Terrains.vue';

const lines = ref<InstanceType<typeof Lines>>()
const terrains = ref<InstanceType<typeof Terrains>>()
const saveStore = useSaveStore()

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
function fakeSave(){
    console.log(saveStore.save)
}

onMounted(()=>{
    //lines.value?.comeOut()
})
</script>

<template>
    <div class="menu">
        <div @click="openSidebarOf('lines')" class="sqrBtn withShadow">线</div>
        <div @click="openSidebarOf('terrains')" class="sqrBtn withShadow">地</div>
        <div @click="fakeSave" class="sqrBtn withShadow">存</div>
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