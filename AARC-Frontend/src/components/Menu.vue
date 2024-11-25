<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Lines from './sideList/Lines.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import Terrains from './sideList/Terrains.vue';

const lines = ref<InstanceType<typeof Lines>>()
const terrains = ref<InstanceType<typeof Lines>>()
const saveStore = useSaveStore()

function fakeSave(){
    console.log(saveStore.save)
}

onMounted(()=>{
    //lines.value?.comeOut()
})
</script>

<template>
    <div class="menu">
        <div @click="lines?.comeOut" class="sqrBtn withShadow">线</div>
        <div @click="terrains?.comeOut" class="sqrBtn withShadow">地</div>
        <div @click="fakeSave" class="sqrBtn withShadow">存</div>
    </div>
    <Lines ref="lines"></Lines>
    <Terrains ref="terrains"></Terrains>
</template>

<style scoped lang="scss">
.menu{
    position: fixed;
    bottom: 5px;
    right: 5px;
    display: flex;
    flex-direction: column;
    gap: 10px
}
</style>