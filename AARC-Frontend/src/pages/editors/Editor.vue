<script setup lang="ts">
import Cvs from '@/components/Cvs.vue';
import Menu from '@/components/Menu.vue';
import UnsavedLeavingWarning from '@/components/common/UnsavedLeavingWarning.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, onUnmounted, ref, watch } from 'vue';
import { devSave } from '@/dev/devSave';
import { useApiStore } from '@/app/com/api';
import { ensureValidSave } from '@/models/save';
import { usePreventLeavingUnsaved } from '@/utils/eventUtils/preventLeavingUnsaved';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { useResetterStore } from '@/models/stores/utils/resetterStore';
import { useScalerLocalConfigStore } from '@/app/localConfig/scalerLocalConfig';

const props = defineProps<{saveId:string}>()
const { topbarShow, pop } = storeToRefs(useUniqueComponentsStore())
const saveStore = useSaveStore()
const resetterStore = useResetterStore()
const api = useApiStore().get()
const saveIdNum = computed(()=>parseInt(props.saveId))
let loadedSaveIdNum = 0
const loadComplete = ref(false)
const mainCvsDispatcher = useMainCvsDispatcher()
const isDemo = computed(()=>props.saveId.toLowerCase() == 'demo')
const scalerLocalConfig = useScalerLocalConfigStore()
async function load() {
    if(!isNaN(saveIdNum.value)){
        const resp = await api.save.loadData(saveIdNum.value)
        try{
            const obj = resp ? JSON.parse(resp) : {}
            saveStore.save = ensureValidSave(obj)
            resetterStore.resetDerivedStores()
            loadComplete.value = true
        }catch{
            pop.value?.show('存档损坏，请联系管理员', 'failed')
        }
    }
    else if(isDemo.value){
        saveStore.save = JSON.parse(JSON.stringify(devSave))
        resetterStore.resetDerivedStores()
        loadComplete.value = true
        pop.value?.show('此处为体验环境，不能保存', 'warning')
        window.setTimeout(()=>{
            pop.value?.show('如需创作，请注册账户并新建存档', 'warning')
        }, 3000)
    }
    loadedSaveIdNum = saveIdNum.value || 0
}

const { preventLeaving, releasePreventLeaving, showUnsavedWarning } = usePreventLeavingUnsaved()
async function saveData(){
    if(isNaN(saveIdNum.value)){
        pop.value?.show('此处不能保存', 'failed')
        return
    }
    const data = JSON.stringify(saveStore.save)
    const staCount = saveStore.getStaCount()
    const lineCount = saveStore.getLineCount()
    const resp = await api.save.updateData(saveIdNum.value, data, staCount, lineCount)
    if(resp){
        releasePreventLeaving()
    }
}

function setLeavingPreventing(){
    //将“主画布重新渲染”当成“存档信息变化”，当主画布重新渲染时，阻止用户离开/刷新页面/关闭页面
    if(!isDemo.value)
        mainCvsDispatcher.afterMainCvsRendered = preventLeaving
    else
        mainCvsDispatcher.afterMainCvsRendered = undefined
}
const cvsComponent = ref<InstanceType<typeof Cvs>>()
watch(props, async()=>{
    if(loadedSaveIdNum !== saveIdNum.value){
        window.location.reload()
    }
})
onBeforeMount(async()=>{
    setLeavingPreventing()
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
    <Cvs v-if="loadComplete" ref="cvsComponent"></Cvs>
    <Menu v-if="loadComplete" @save-data="saveData"></Menu>
    <UnsavedLeavingWarning v-if="showUnsavedWarning" :release="releasePreventLeaving" @ok="showUnsavedWarning=false"></UnsavedLeavingWarning>
    <div v-if="scalerLocalConfig.steppedScaleEnabled" class="steppedScaleEnabled">已启用步进式缩放</div>
</template>

<style scoped lang="scss">
.steppedScaleEnabled{
    z-index: 999;
    position: fixed;
    top: 0px;
    right: 20px;
    font-size: 14px;
    color: #aaa;
    text-align: right;
}
</style>