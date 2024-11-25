<script setup lang="ts">
import Cvs from './components/Cvs.vue';
import Menu from './components/Menu.vue';
import { useSaveStore } from './models/stores/saveStore';
import { ref } from 'vue';
import { devSave } from './dev/devSave';

const saveStore = useSaveStore();
saveStore.save = devSave
const menu = ref<InstanceType<typeof Menu>>()
</script>

<template>
<Cvs></Cvs>
<Menu ref="menu"></Menu>
</template>

<style>

</style>