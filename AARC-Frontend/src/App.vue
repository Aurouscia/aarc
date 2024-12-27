<script setup lang="ts">
import { useSaveStore } from './models/stores/saveStore';
import { devSave } from './dev/devSave';
import Pop from './components/common/Pop.vue';
import Wait from './components/common/Wait.vue';
import { useUniqueComponentsStore } from './utils/app/globalStores/uniqueComponents';
import { storeToRefs } from 'pinia';
import TopbarParent from './components/common/topbar/TopbarParent.vue';

const saveStore = useSaveStore();
const { pop, wait } = storeToRefs(useUniqueComponentsStore())

saveStore.save = devSave
</script>

<template>
<TopbarParent></TopbarParent>
<div class="main">
    <RouterView></RouterView>
</div>
<Pop ref="pop"></Pop>
<Wait ref="wait"></Wait>
</template>

<style scoped lang="scss">
@use '@/styles/globalValues';

.main{
    width: calc(100vw - 2 * globalValues.$mainDivLRMargin);
    margin: auto;
    padding-top: globalValues.$topbar-height;
    height: globalValues.$body-height;
    box-sizing: border-box;
    max-width: 1400px;
    transition: 0s;
}
</style>