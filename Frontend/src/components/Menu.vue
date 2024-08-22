<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Lines from './Lines.vue';
import { useSaveStore } from '@/models/stores/saveStore';

const lines = ref<InstanceType<typeof Lines>>()
const saveStore = useSaveStore()

function fakeSave(){
    console.log(saveStore.save)
}

onMounted(()=>{
    lines.value?.comeOut()
})
</script>

<template>
    <div class="menu">
        <div @click="fakeSave">存</div>
        <div @click="lines?.comeOut" class="sqrBtn withShadow">线</div>
    </div>
    <Lines ref="lines"></Lines>
</template>

<style scoped lang="scss">
.menu{
    position: fixed;
    bottom: 5px;
    right: 5px;
    display: flex;
    flex-direction: column;
}
</style>