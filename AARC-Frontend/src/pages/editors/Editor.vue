<script setup lang="ts">
import Cvs from '@/components/Cvs.vue';
import Menu from '@/components/Menu.vue';
import UnsavedLeavingWarning from '@/components/common/UnsavedLeavingWarning.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, onUnmounted, ref } from 'vue';
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
const isDemo = computed(()=>props.saveId.toLowerCase() == 'demo')
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
    else if(isDemo.value){
        saveStore.save = JSON.parse(JSON.stringify(devSave))
        loadComplete.value = true
        pop.value?.show('此处为体验环境，不能保存', 'warning')
        window.setTimeout(()=>{
            pop.value?.show('如需创作，请注册账户并新建存档', 'warning')
        }, 3000)
    }
}

const { preventLeaving, releasePreventLeaving, showUnsavedWarning } = usePreventLeavingUnsaved()
async function saveData(){
    if(isNaN(saveIdNum)){
        pop.value?.show('此处不能保存', 'failed')
        return
    }
    const data = JSON.stringify(saveStore.save)
    const resp = await api.save.updateData(saveIdNum, data)
    if(resp){
        releasePreventLeaving()
    }
}

onBeforeMount(async()=>{
    //将“主画布重新渲染”当成“存档信息变化”，当主画布重新渲染时，阻止用户离开/刷新页面/关闭页面
    if(!isDemo.value)
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