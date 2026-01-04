<script setup lang="ts">
import Cvs from '@/components/Cvs.vue';
import Menu from '@/components/Menu.vue';
import UnsavedLeavingWarning from '@/components/common/UnsavedLeavingWarning.vue';
import { useSaveStore } from '@/models/stores/saveStore';
import { useEnvStore } from '@/models/stores/envStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { storeToRefs } from 'pinia';
import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue';
import { devSave } from '@/data/dev/devSave';
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
import { HttpUserInfo, SavePreflightStatus } from '@/app/com/apiGenerated';
import DontUseWeirdBrowser from './components/DontUseWeirdBrowser.vue';
import { useSavesRoutesJump } from '../saves/routes/routesJump';
import { useEnteredCanvasFromStore } from '@/app/globalStores/enteredCanvasFrom';
import { useIdentitiesRoutesJump } from '../identities/routes/routesJump';

const heartbeatIntervalSecs = 3 * 60 // 每3分钟心跳一次

const props = defineProps<{saveId:string}>()
const { someonesSavesRoute } = useSavesRoutesJump()
const { loginRoute } = useIdentitiesRoutesJump()
const { goBackToWhereWeEntered } = useEnteredCanvasFromStore()
const uniq = useUniqueComponentsStore()
const { showPop } = uniq
const { topbarShow } = storeToRefs(uniq)
const saveStore = useSaveStore()
const envStore = useEnvStore()
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
const viewOnly = ref(false)
const loadError = ref<string>()
const ownerUserInfo = ref<{userId: number, userName: string}>()
const editingUserInfo = ref<{userId: number, userName: string}>()
const savingDisabledWarning = ref<string>()
const savingDisabledWarningHide = ref<boolean>()

async function load() {
    loadedSave.value = true
    if(!isNaN(saveIdNum.value)){
        const userInfo = await userInfoStore.getIdentityInfo(true)
        const preRes = await api.save.preflight(saveIdNum.value)
        if(!preRes)
            return
        if(preRes.status == SavePreflightStatus.NotFound){
            loadError.value = '未找到指定存档，请核对链接是否正确'
            return
        }
        if(preRes.status == SavePreflightStatus.ViewBlocked){
            loadError.value = '根据权限设置，无法查看本存档'
            ownerUserInfo.value = { userId: preRes.ownerUserId ?? 0, userName: preRes.ownerUserName ?? ''}
            return
        }
        if(preRes.status == SavePreflightStatus.ViewOnly || preRes.status == SavePreflightStatus.Occupied){
            if(!viewOnly.value){
                console.log('根据preflight结果，已设为viewOnly模式')
                viewOnly.value = true
            }
            if(preRes.status == SavePreflightStatus.ViewOnly)
                savingDisabledWarning.value = '当前为仅浏览模式，无法保存更改'
            else if(preRes.status == SavePreflightStatus.Occupied){
                savingDisabledWarning.value = `当前有其他用户在编辑，无法保存更改\n占用者：${preRes.editingByUserName ?? '??'}`
                editingUserInfo.value = { userId: preRes.editingByUserId ?? 0, userName: preRes.editingByUserName ?? '' }
            }
        }

        await checkLoginLeftTime(userInfo)
        
        mainCvsDispatcher.visitorMode = viewOnly.value
        let resp
        try{
            const loadForEdit = !viewOnly.value
            resp = await api.save.loadData(saveIdNum.value, loadForEdit)
        }
        catch{
            return // http失败：中止加载，避免cvs出现
        }
        try{
            const obj = resp ? JSON.parse(resp) : undefined
            saveStore.save = normalizeSave(obj)
            resetterStore.resetDerivedStores()
            saveStore.ensureLinesOrdered()
            await iconStore.ensureAllLoaded()
            loadComplete.value = true
        }catch{
            showPop('存档损坏，请联系管理员', 'failed')
        }
        if(viewOnly.value){
            preventLeavingDisabled.value = true //浏览模式，不阻止未保存退出
        }
        else{
            startHeartbeat()
        }
    }
    else if(isDemo.value){
        saveStore.save = normalizeSave(deepClone(devSave))
        resetterStore.resetDerivedStores()
        saveStore.ensureLinesOrdered()
        await iconStore.ensureAllLoaded()
        mainCvsDispatcher.visitorMode = false
        loadComplete.value = true
        savingDisabledWarning.value = '此处为体验环境，不能保存\n如需创作，请注册账户并新建存档'
        savingDisabledWarningHide.value = true //暂时隐藏，等第一次编辑后再出现
        preventLeavingDisabled.value = true //demo环境，不阻止未保存退出
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
        showPop('此处不能保存', 'failed')
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
        resp = await api.save.updateData(saveIdNum.value, false, data, staCount, lineCount)
    }
    if(resp){
        releasePreventLeaving()
        showPop('保存成功', 'success')

        //次要任务：更新缩略图，无论是否成功都不影响主流程
        const miniCvs = miniatureCvsDispatcher.renderMiniatureCvs(256, 2)
        const miniBlob = await miniCvs.convertToBlob()
        await api.save.updateMiniature(saveIdNum.value, {data:miniBlob, fileName:'mini.png'})

        //重新初始化心跳定时器周期，因为“保存”本身会触发一次心跳续约
        endHeartbeat()
        startHeartbeat()
    }
}

const notLogin = ref<boolean>()
const notLoginFirstWarned = ref<boolean>()
async function checkLoginLeftTime(userInfo:HttpUserInfo){
    const nearExpireMsg = '登录即将过期\n尽快重新登录'
    const noLoginMsg = '当前没有登录\n不能保存'
    if(!userInfo.leftHours){
        notLogin.value = true
        savingDisabledWarning.value = noLoginMsg
        preventLeavingDisabled.value = true //未登录：不阻止未保存退出（也没法保存）
        savingDisabledWarningHide.value = true //暂时隐藏，等第一次编辑后再出现
    }
    else if(userInfo.leftHours <= 6){
        showPop(nearExpireMsg, 'warning')
        savingDisabledWarning.value = nearExpireMsg
        window.setTimeout(()=>{
            showPop('否则将无法保存', 'warning')
        }, 3000)
    }
}

function setLeavingPreventing(){
    //将“主画布重新渲染”当成“存档信息变化”，当主画布重新渲染时，阻止用户离开/刷新页面/关闭页面
    mainCvsDispatcher.afterMainCvsRendered = () =>{ 
        if(!notLoginFirstWarned.value){
            savingDisabledWarningHide.value = false
            notLoginFirstWarned.value = true
        }
        preventLeaving()
    }
}

let heartbeatTimer = 0
function startHeartbeat(){
    // 开始心跳续约周期（不需要立即执行一次，因为loadData相当于已经执行过一次）
    heartbeatTimer = window.setInterval(async()=>{
        await api.save.heartbeatRenewal(saveIdNum.value)
    }, heartbeatIntervalSecs * 1000)
}
function endHeartbeat(){
    // 结束心跳续约周期
    window.clearInterval(heartbeatTimer)
}

watch(props, async()=>{
    // 一旦画布id发生变化，刷新浏览器（否则无法保证状态清理干净）
    window.location.reload()
})

const saveShortcutListener = new ShortcutListener(()=>{ saveData() }, {code:'KeyS', ctrl:true})
const deleteShortcutListener = new ShortcutListener(()=>{
    const ael = document.activeElement
    const focusingText = ael instanceof HTMLInputElement || ael instanceof HTMLTextAreaElement
    if(focusingText){
        // 如果正在输入文字：不prevent浏览器默认行为（delete键确实有用）且不进行删除操作
        return { dontPrevent: true }
    }
    else{
        // 不是正在输入文字：进行删除操作
        envStore.delActivePt(true, true)
        envStore.delActiveTextTag(true)
    }
}, {code:'Delete'})
const cachePreventerInputId = 'cachePreventerInput'
const { cachePreventStart, cachePreventStop } = useCachePreventer(cachePreventerInputId)
const showHiddenLongWarn = ref(false)
const hiddenLongWatcher = new DocumentHiddenLongWatcher(30*1000, ()=>{
    if(!isDemo.value && !viewOnly.value)
        showHiddenLongWarn.value = true
}) 
onBeforeMount(async()=>{
    topbarShow.value = false
    // 一旦发现之前加载过其他画布，刷新浏览器（否则无法保证状态清理干净）
    if(loadedSave.value){
        window.location.reload()
        return
    }
    setLeavingPreventing()
    await load()
    saveShortcutListener.start()
    deleteShortcutListener.start()
    cachePreventStart()
    hiddenLongWatcher.startWatching()
})
onBeforeUnmount(()=>{
    endHeartbeat()
    if(!isDemo.value && !viewOnly.value){
        // 仅在“非浏览模式”下，才释放心跳
        api.save.heartbeatRelease(saveIdNum.value)
           .then(()=>{console.log('心跳释放成功')})
           .catch((e)=>{console.error('心跳释放失败', e)})
    }
    mainCvsDispatcher.afterMainCvsRendered = undefined
    topbarShow.value = true
    saveShortcutListener.dispose()
    deleteShortcutListener.dispose()
    cachePreventStop()
    hiddenLongWatcher.stopWatching()
})
</script>

<template>
    <div v-if="loadError" class="load-error">
        {{ loadError }}
        <RouterLink v-if="ownerUserInfo?.userId" :to="someonesSavesRoute(ownerUserInfo.userId)">
            看看作者 {{ ownerUserInfo.userName }} 的其他作品</RouterLink>
        <button class="minor" @click="goBackToWhereWeEntered">点击返回</button>
    </div>
    <Cvs v-if="loadComplete"></Cvs>
    <Menu v-if="loadComplete" @save-data="saveData"></Menu>
    <UnsavedLeavingWarning v-if="showUnsavedWarning" :release="releasePreventLeaving"
        :save="saveData" @ok="showUnsavedWarning=false"></UnsavedLeavingWarning>
    <HiddenLongWarnPrompt v-if="showHiddenLongWarn" @ok="showHiddenLongWarn=false"></HiddenLongWarnPrompt>
    <div v-if="savingDisabledWarning" class="statusDisplay saving-disabled-warning" :class="{'warning-hidden': savingDisabledWarningHide}">
        {{ savingDisabledWarning }}
        <RouterLink v-if="notLogin" :to="loginRoute(true)">去登录</RouterLink>
        <RouterLink v-else-if="editingUserInfo?.userId" :to="someonesSavesRoute(editingUserInfo.userId)">看看TA的作品</RouterLink>
        <button @click="savingDisabledWarningHide=true">知道了</button>
    </div>
    <div class="cache-preventer"><input :id="cachePreventerInputId"/></div>
    <DontUseWeirdBrowser></DontUseWeirdBrowser>
</template>

<style scoped lang="scss">
.load-error{
    background-color: white;
    position: fixed;
    left: 0px; top: 0px;
    width: 100vw; height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 22px;
    color: #999;
    gap: 20px;
    a { color: inherit }
    a, button { font-size: 16px; }
}
.cache-preventer{
    position: fixed;
    z-index: -1;
    top: -100px; //藏起来
}
.saving-disabled-warning{
    color:white;
    animation: colorBlink 1s ease-out infinite;
    white-space: pre-wrap;
    line-height: 22px;
    a {
        margin-left: 16px;
        color: white;
        text-decoration: underline;
    }
    button {
        display: block;
        background-color: white;
        margin: 6px auto 3px;
        padding: 3px 20px;
        color: red;
        font-weight: bold;
    }
    &.warning-hidden {
        transform: translateY(140%);
        background-color: red;
        animation: none;
    }
}
@keyframes colorBlink {
    0% {
        background-color: red;
    }
    100% {
        background-color: orange;
    }
}
</style>