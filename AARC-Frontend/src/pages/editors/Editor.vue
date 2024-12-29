<script setup lang="ts">
import Cvs from '@/components/Cvs.vue';
import Menu from '@/components/Menu.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { storeToRefs } from 'pinia';
import { onBeforeMount, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router'
import { devSave } from '@/dev/devSave';
import { useApiStore } from '@/app/com/api';
import { ensureValidSave } from '@/models/save';

const props = defineProps<{saveId:string}>()
const { topbarShow, pop } = storeToRefs(useUniqueComponentsStore())
const saveStore = useSaveStore()
const api = useApiStore().get()
const saveIdNum = parseInt(props.saveId)
const loadComplete = ref(false)

async function load() {
    if(!isNaN(saveIdNum)){
        const resp = await api.save.loadData(saveIdNum)
        try{
            const obj = resp ? JSON.parse(resp) : {}
            saveStore.save = ensureValidSave(obj)
            loadComplete.value = true
        }catch{
            pop.value?.show('存档损坏，请联系管理员', 'failed')
        }
    }
    else if(props.saveId.toLowerCase() == 'demo'){
        saveStore.save = devSave
        loadComplete.value = true
    }
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
    <Cvs v-if="loadComplete"></Cvs>
    <Menu v-if="loadComplete"></Menu>
</template>

<style scoped lang="scss">

</style>