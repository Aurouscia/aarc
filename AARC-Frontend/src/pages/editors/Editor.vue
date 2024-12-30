<script setup lang="ts">
import Cvs from '@/components/Cvs.vue';
import Menu from '@/components/Menu.vue';
import UnsavedLeavingWarning from '@/components/common/UnsavedLeavingWarning.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { storeToRefs } from 'pinia';
import { onBeforeMount, onUnmounted, ref } from 'vue';
import { devSave } from '@/dev/devSave';
import { useApiStore } from '@/app/com/api';
import { ensureValidSave } from '@/models/save';
import { usePreventLeavingUnsaved } from '@/utils/eventUtils/preventLeavingUnsaved';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';

const props = defineProps<{saveId:string}>()
const { topbarShow, pop } = storeToRefs(useUniqueComponentsStore())
const saveStore = useSaveStore()
const api = useApiStore().get()
const saveIdNum = parseInt(props.saveId)
const loadComplete = ref(false)
const mainCvsDispatcher = useMainCvsDispatcher()
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

const { preventLeaving, releasePreventLeaving, showUnsavedWarning } = usePreventLeavingUnsaved()
async function saveData(){
    const data = JSON.stringify(saveStore.save)
    const resp = await api.save.updateData(saveIdNum, data)
    if(resp){
        releasePreventLeaving()
    }
}

onBeforeMount(async()=>{
    //将“主画布重新渲染”当成“存档信息变化”，当主画布重新渲染时，阻止用户离开/刷新页面/关闭页面
    mainCvsDispatcher.afterMainCvsRendered = preventLeaving
    topbarShow.value = false
    await load()
})
onUnmounted(()=>{
    mainCvsDispatcher.afterMainCvsRendered = undefined
    topbarShow.value = true
})
</script>

<template>
    <Cvs v-if="loadComplete"></Cvs>
    <Menu v-if="loadComplete" @save-data="saveData"></Menu>
    <UnsavedLeavingWarning v-if="showUnsavedWarning" :release="releasePreventLeaving" @ok="showUnsavedWarning=false"></UnsavedLeavingWarning>
</template>

<style scoped lang="scss">

</style>