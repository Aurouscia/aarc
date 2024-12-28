<script setup lang="ts">
import Cvs from '@/components/Cvs.vue';
import Menu from '@/components/Menu.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { useUniqueComponentsStore } from '@/utils/app/globalStores/uniqueComponents';
import { storeToRefs } from 'pinia';
import { onBeforeMount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router'
import { devSave } from '@/dev/devSave';

const props = defineProps<{saveId:string}>()
const { topbarShow } = storeToRefs(useUniqueComponentsStore())
const saveStore = useSaveStore()
parseInt(props.saveId)

async function load() {
    saveStore.save = devSave
}

onBeforeMount(async()=>{
    topbarShow.value = false
    await load()
})
onBeforeRouteLeave(()=>{
    topbarShow.value = true
})
</script>

<template>
    <Cvs></Cvs>
    <Menu></Menu>
</template>

<style scoped lang="scss">

</style>