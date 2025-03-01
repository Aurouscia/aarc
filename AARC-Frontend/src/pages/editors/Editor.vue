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
import { usePreventLeavingUnsavedStore } from '@/utils/eventUtils/preventLeavingUnsaved';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { useResetterStore } from '@/models/stores/utils/resetterStore';
import { useScalerLocalConfigStore } from '@/app/localConfig/scalerLocalConfig';
import rfdc from 'rfdc';
import { useConfigStore } from '@/models/stores/configStore';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { ShortcutListener } from '@aurouscia/keyboard-shortcut'
import { useMiniatureCvsDispatcher } from '@/models/cvs/dispatchers/miniatureCvsDispatcher';
import { useCachePreventer } from '@/utils/timeUtils/cachePreventer';

const props = defineProps<{saveId:string}>()
const { topbarShow, pop } = storeToRefs(useUniqueComponentsStore())
const saveStore = useSaveStore()
const configStore = useConfigStore()
const resetterStore = useResetterStore()
const api = useApiStore().get()
const userInfoStore = useUserInfoStore()
const saveIdNum = computed(()=>parseInt(props.saveId))
let loadedSaveIdNum = 0
const loadComplete = ref(false)
const mainCvsDispatcher = useMainCvsDispatcher()
const miniatureCvsDispatcher = useMiniatureCvsDispatcher()
const isDemo = computed(()=>props.saveId.toLowerCase() == 'demo')
const scalerLocalConfig = useScalerLocalConfigStore()
const savingDisabledWarning = ref<string>()
async function load() {
    if(!isNaN(saveIdNum.value)){
        await checkLoginLeftTime()
        const resp = await api.save.loadData(saveIdNum.value)
        try{
            const obj = resp ? JSON.parse(resp) : {}
            saveStore.save = ensureValidSave(obj)
            resetterStore.resetDerivedStores()
            loadComplete.value = true
        }catch{
            pop.value?.show('存档损坏，请联系管理员', 'failed')
        }
        const ownerId = (await api.save.loadInfo(saveIdNum.value))?.OwnerUserId || -1
        const iden = await userInfoStore.getIdentityInfo()
        if(iden.Id>0 && iden.Id !== ownerId){
            savingDisabledWarning.value = '非存档所有者，仅供浏览，不能保存'
        }
    }
    else if(isDemo.value){
        saveStore.save = ensureValidSave(deepClone(devSave))
        resetterStore.resetDerivedStores()
        loadComplete.value = true
        pop.value?.show('此处为体验环境，不能保存', 'warning')
        savingDisabledWarning.value = '此处为体验环境，不能保存'
        window.setTimeout(()=>{
            pop.value?.show('如需创作，请注册账户并新建存档', 'warning')
        }, 3000)
    }
    loadedSaveIdNum = saveIdNum.value || 0
}

const deepClone = rfdc()
const preventLeaveStore = usePreventLeavingUnsavedStore()
const { preventLeaving, releasePreventLeaving } = preventLeaveStore
const { showUnsavedWarning } = storeToRefs(preventLeaveStore)
async function saveData(){
    configStore.writeConfigToSave()
    if(isNaN(saveIdNum.value)){
        if(import.meta.env.DEV){
            const saveCopy = deepClone(saveStore.save)
            console.log(saveCopy)
        }
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
    const miniCvs = miniatureCvsDispatcher.renderMiniatureCvs(256, 2)
    const miniBlob = await miniCvs.convertToBlob()
    await api.save.updateMiniature(saveIdNum.value, miniBlob)
}
async function checkLoginLeftTime(){
    const userInfo = await userInfoStore.getIdentityInfo()
    const nearExpireMsg = '登录即将过期\n尽快重新登录'
    const noLoginMsg = '当前没有登录\n不能保存'
    if(userInfo.LeftHours === 0){
        pop.value?.show(noLoginMsg, 'warning')
        savingDisabledWarning.value = noLoginMsg
    }
    else if(userInfo.LeftHours <= 6){
        pop.value?.show(nearExpireMsg, 'warning')
        savingDisabledWarning.value = nearExpireMsg
        window.setTimeout(()=>{
            pop.value?.show('否则将无法保存', 'warning')
        }, 3000)
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
const saveShortcutListener = new ShortcutListener(saveData, 's', true)
const cachePreventerInputId = 'cachePreventerInput'
const { cachePreventStart, cachePreventStop } = useCachePreventer(cachePreventerInputId)
onBeforeMount(async()=>{
    setLeavingPreventing()
    if(!isDemo.value)
        mainCvsDispatcher.afterMainCvsRendered = preventLeaving
    topbarShow.value = false
    await load()
    saveShortcutListener.startListen()
    cachePreventStart()
})
onUnmounted(()=>{
    mainCvsDispatcher.afterMainCvsRendered = undefined
    topbarShow.value = true
    saveShortcutListener.dispose()
    cachePreventStop()
})
</script>

<template>
    <Cvs v-if="loadComplete" ref="cvsComponent"></Cvs>
    <Menu v-if="loadComplete" @save-data="saveData"></Menu>
    <UnsavedLeavingWarning v-if="showUnsavedWarning" :release="releasePreventLeaving" @ok="showUnsavedWarning=false"></UnsavedLeavingWarning>
    <div v-if="scalerLocalConfig.steppedScaleEnabled" class="steppedScaleEnabled">已启用步进式缩放</div>
    <div v-if="savingDisabledWarning" class="savingDisabledWarning">{{ savingDisabledWarning }}</div>
    <div class="cachePreventer">
        <input :id="cachePreventerInputId"/>
    </div>
</template>

<style scoped lang="scss">
.cachePreventer{
    position: relative;
    z-index: -1;
}
.steppedScaleEnabled{
    z-index: 999;
    position: fixed;
    top: 0px;
    right: 20px;
    font-size: 14px;
    color: #aaa;
    text-align: right;
}
.savingDisabledWarning{
    z-index: 999;
    position: fixed;
    bottom: 15px;
    left: 0px;
    right: 0px;
    width: fit-content;
    margin: auto;
    text-align: center;
    color: white;
    padding: 3px;
    border-radius: 3px;
    background-color: orange;
    font-weight: bold;
    box-shadow: 0px 0px 10px 3px black;
}
</style>