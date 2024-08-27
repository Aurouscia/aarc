<script setup lang="ts">
import Cvs from './components/Cvs.vue';
import Menu from './components/Menu.vue';
import { useSaveStore } from './models/stores/saveStore';
import { onMounted, ref } from 'vue';
import { devSave } from './dev/devSave';

const saveStore = useSaveStore();
const menu = ref<InstanceType<typeof Menu>>()

onMounted(()=>{
    saveStore.save = devSave
})
</script>

<template>
<Cvs></Cvs>
<Menu ref="menu"></Menu>
</template>

<style>

</style>