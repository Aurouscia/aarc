<script setup lang="ts">
import Cvs from '@/components/Cvs.vue';
import Menu from '@/components/Menu.vue';
import UnsavedLeavingWarning from '@/components/common/UnsavedLeavingWarning.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, onUnmounted, ref, watch } from 'vue';
import { devSave } from '@/dev/devSave';
import { useApiStore } from '@/app/com/apiStore';
import { normalizeSave } from '@/models/save/saveNormalize';
import { usePreventLeavingUnsavedStore } from '@/utils/eventUtils/preventLeavingUnsaved';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { useResetterStore } from '@/models/stores/utils/resetterStore';
import rfdc from 'rfdc';
import { useConfigStore } from '@/models/stores/configStore';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { ShortcutListener } from '@aurouscia/keyboard-shortcut'
import { useMiniatureCvsDispatcher } from '@/models/cvs/dispatchers/miniatureCvsDispatcher';
import { useCachePreventer } from '@/utils/timeUtils/cachePreventer';
import { DocumentHiddenLongWatcher } from '@/utils/eventUtils/documentHiddenLong';
import HiddenLongWarnPrompt from './components/HiddenLongWarnPrompt.vue';
import { useIconStore } from '@/models/stores/iconStore';
import { compressObjectToGzip } from '@/utils/dataUtils/compressObjectToGzip';
import { useLoadedSave } from '@/models/stores/utils/loadedSave';

const props = defineProps<{saveId:string}>()
const { topbarShow, pop } = storeToRefs(useUniqueComponentsStore())
const saveStore = useSaveStore()
const configStore = useConfigStore()
const resetterStore = useResetterStore()
const iconStore = useIconStore()
const api = useApiStore()
const userInfoStore = useUserInfoStore()
const saveIdNum = computed(()=>parseInt(props.saveId))
const { loadedSave } = storeToRefs(useLoadedSave())
const loadComplete = ref(false)
const mainCvsDispatcher = useMainCvsDispatcher()
const miniatureCvsDispatcher = useMiniatureCvsDispatcher()
const isDemo = computed(()=>props.saveId.toLowerCase() == 'demo')
const savingDisabledWarning = ref<string>()
async function load() {
    loadedSave.value = true
    if(!isNaN(saveIdNum.value)){
        await checkLoginLeftTime()
        const resp = await api.save.loadData(saveIdNum.value)
        const ownerId = (await api.save.loadInfo(saveIdNum.value))?.ownerUserId || -1
        const iden = await userInfoStore.getIdentityInfo()
        const isOwner = ownerId && ownerId === iden.id
        mainCvsDispatcher.visitorMode = !isOwner
        try{
            const obj = resp ? JSON.parse(resp) : undefined
            saveStore.save = normalizeSave(obj)
            resetterStore.resetDerivedStores()
            saveStore.ensureLinesOrdered()
            await iconStore.ensureAllLoaded()
            loadComplete.value = true
        }catch{
            pop.value?.show('存档损坏，请联系管理员', 'failed')
        }
        if(iden.id && !isOwner){
            savingDisabledWarning.value = '非存档所有者，仅供浏览，不能保存'
            preventLeavingDisabled.value = true //登录了但不是所有者，不阻止未保存退出
        }
    }
    else if(isDemo.value){
        saveStore.save = normalizeSave(deepClone(devSave))
        resetterStore.resetDerivedStores()
        saveStore.ensureLinesOrdered()
        await iconStore.ensureAllLoaded()
        mainCvsDispatcher.visitorMode = false
        loadComplete.value = true
        savingDisabledWarning.value = '此处为体验环境，不能保存'
        preventLeavingDisabled.value = true //demo环境，不阻止未保存退出
        if(import.meta.env.PROD){
            pop.value?.show('此处为体验环境，不能保存', 'warning')
            window.setTimeout(()=>{
                pop.value?.show('如需创作，请注册账户并新建存档', 'warning')
            }, 3000)
        }
    }
}

const deepClone = rfdc()
const preventLeaveStore = usePreventLeavingUnsavedStore()
const { preventLeaving, releasePreventLeaving } = preventLeaveStore
const { showUnsavedWarning, preventLeavingDisabled } = storeToRefs(preventLeaveStore)
let lastSavedTime = 0
async function saveData(){
    if(lastSavedTime + 1000 > Date.now()){
        console.warn('保存过于频繁（1秒内），已忽略本次保存请求')
        return
    }
    lastSavedTime = Date.now()
    configStore.writeConfigToSave()
    if(isNaN(saveIdNum.value)){
        if(import.meta.env.DEV){
            const saveCopy = deepClone(saveStore.save)
            console.log(saveCopy)
        }
        pop.value?.show('此处不能保存', 'failed')
        return
    }
    const staCount = saveStore.getStaCount()
    const lineCount = saveStore.getLineCount()

    let resp:boolean|undefined = false
    let blob:Blob|'notSupported';
    try{  
        blob = await compressObjectToGzip(saveStore.save??{})
    }
    catch{
        blob = 'notSupported'
        console.warn('存档数据压缩失败，使用原版保存机制')
    }
    if(blob instanceof Blob){
        resp = await api.save.updateDataCompressed(saveIdNum.value, {fileName:'data', data:blob}, staCount, lineCount)
    }
    else{
        //若blob不是Blob（浏览器不支持压缩或出了问题）则直接明文保存
        const data = JSON.stringify(saveStore.save??{})
        resp = await api.save.updateData(saveIdNum.value, data, staCount, lineCount)
    }
    if(resp){
        releasePreventLeaving()
        pop.value?.show('保存成功', 'success')

        //次要任务：更新缩略图，无论是否成功都不影响主流程
        const miniCvs = miniatureCvsDispatcher.renderMiniatureCvs(256, 2)
        const miniBlob = await miniCvs.convertToBlob()
        await api.save.updateMiniature(saveIdNum.value, {data:miniBlob, fileName:'mini.png'})
    }
}
async function checkLoginLeftTime(){
    const userInfo = await userInfoStore.getIdentityInfo()
    const nearExpireMsg = '登录即将过期\n尽快重新登录'
    const noLoginMsg = '当前没有登录\n不能保存'
    if(!userInfo.leftHours){
        pop.value?.show(noLoginMsg, 'warning')
        savingDisabledWarning.value = noLoginMsg
        preventLeavingDisabled.value = true //未登录：不阻止未保存退出（也没法保存）
    }
    else if(userInfo.leftHours <= 6){
        pop.value?.show(nearExpireMsg, 'warning')
        savingDisabledWarning.value = nearExpireMsg
        window.setTimeout(()=>{
            pop.value?.show('否则将无法保存', 'warning')
        }, 3000)
    }
}

function setLeavingPreventing(){
    //将“主画布重新渲染”当成“存档信息变化”，当主画布重新渲染时，阻止用户离开/刷新页面/关闭页面
    mainCvsDispatcher.afterMainCvsRendered = preventLeaving
}
const cvsComponent = ref<InstanceType<typeof Cvs>>()
watch(props, async()=>{
    window.location.reload()
})
const saveShortcutListener = new ShortcutListener(saveData, 's', true)
const cachePreventerInputId = 'cachePreventerInput'
const { cachePreventStart, cachePreventStop } = useCachePreventer(cachePreventerInputId)
const showHiddenLongWarn = ref(false)
const hiddenLongWatcher = new DocumentHiddenLongWatcher(30*1000, ()=>{
    if(!isDemo.value)
        showHiddenLongWarn.value = true
}) 
onBeforeMount(async()=>{
    if(loadedSave.value){
        window.location.reload()
    }
    setLeavingPreventing()
    topbarShow.value = false
    await load()
    saveShortcutListener.startListen()
    cachePreventStart()
    hiddenLongWatcher.startWatching()
})
onUnmounted(()=>{
    mainCvsDispatcher.afterMainCvsRendered = undefined
    topbarShow.value = true
    saveShortcutListener.dispose()
    cachePreventStop()
    hiddenLongWatcher.stopWatching()
})
</script>

<template>
    <Cvs v-if="loadComplete" ref="cvsComponent"></Cvs>
    <Menu v-if="loadComplete" @save-data="saveData"></Menu>
    <UnsavedLeavingWarning v-if="showUnsavedWarning" :release="releasePreventLeaving"
        :save="saveData" @ok="showUnsavedWarning=false"></UnsavedLeavingWarning>
    <HiddenLongWarnPrompt v-if="showHiddenLongWarn" @ok="showHiddenLongWarn=false"></HiddenLongWarnPrompt>
    <div v-if="savingDisabledWarning" class="statusDisplay savingDisabledWarning">{{ savingDisabledWarning }}</div>
    <div class="cachePreventer">
        <input :id="cachePreventerInputId"/>
    </div>
</template>

<style scoped lang="scss">
.cachePreventer{
    position: fixed;
    z-index: -1;
    top: -100px; //藏起来
}
.savingDisabledWarning{
    color:white;
    background-color: orange;
}
</style>