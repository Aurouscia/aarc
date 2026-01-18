<script setup lang="ts">
import { useEnvStore } from '@/models/stores/envStore';
import { storeToRefs } from 'pinia';
import { onMounted, nextTick, watch, onBeforeUnmount, computed, CSSProperties, useTemplateRef } from 'vue';
import Ops from './Ops.vue';
import NameEdit from './NameEdit.vue';
import TextTagEdit from './TextTagEdit.vue';
import CvsBlocks from './CvsBlocks.vue';
import { useActiveCvsDispatcher } from '@/models/cvs/dispatchers/activeCvsDispatcher';
import { useBaseCvsDispatcher } from '@/models/cvs/dispatchers/baseCvsDispatcher';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { useConfigStore } from '@/models/stores/configStore';
import { useCvsFrameStore } from '@/models/stores/cvsFrameStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useCvsBlocksControlStore } from '@/models/cvs/common/cvs';
import { useSaveStore } from '@/models/stores/saveStore';
import { disableContextMenu, enableContextMenu } from '@/utils/eventUtils/contextMenu';
import { usePointLinkStore } from '@/models/stores/pointLinkStore';
import { useSelectionStore } from '@/models/stores/selectionStore';

const envStore = useEnvStore();
const { somethingActive } = storeToRefs(envStore)
const { cvsWidth, cvsHeight } = storeToRefs(useSaveStore())
const configStore = useConfigStore();
const cvsFrameStore = useCvsFrameStore()
const baseCvsDispatcher = useBaseCvsDispatcher()
const mainCvsDispatcher = useMainCvsDispatcher()
const activeCvsDispatcher = useActiveCvsDispatcher()
const { showWait } = useUniqueComponentsStore()
const cvsBlocksControlStore = useCvsBlocksControlStore()
const pointLinkStore = usePointLinkStore()
const selectionStore = useSelectionStore()

let activeCvsRenderTimer = 0
const waitKey = 'cvsInit'
const cvsFrame = useTemplateRef('cvsFrame')
const cvsCont = useTemplateRef('cvsCont')

async function init(){
    if(!cvsFrame.value || !cvsCont.value)
        throw new Error('cvsFrame or cvsCont 未找到')
    cvsFrameStore.initDoms(cvsFrame.value, cvsCont.value)
    window.clearInterval(activeCvsRenderTimer)
    showWait(waitKey, true)
    cvsFrameStore.initContSizeStyle()
    await nextTick()
    envStore.init()
    cvsBlocksControlStore.refreshBlocks(false)
    await nextTick()
    configStore.readConfigFromSave()
    baseCvsDispatcher.renderBaseCvs()
    mainCvsDispatcher.renderMainCvs({suppressRenderedCallback:true})
    cvsBlocksControlStore.blocksControlInit()
    activeCvsRenderTimer = window.setInterval(()=>{
        activeCvsDispatcher.renderActiveCvs()
    }, 50)
    disableContextMenu()
    showWait(waitKey, false)
}
const bgRefImageStyle = computed<CSSProperties>(()=>{
    const bgRefImage = configStore.config.bgRefImage
    const opacityNum = bgRefImage.opacity ? parseInt(bgRefImage.opacity.toString()) : NaN
    const res:CSSProperties = {
        position: 'absolute',
        opacity: !isNaN(opacityNum) ? `${opacityNum/100}` : undefined,
    }
    if(typeof bgRefImage.left === 'number'){
        res.left = `${bgRefImage.left/cvsWidth.value*100}%`
    }
    if(typeof bgRefImage.right === 'number'){
        res.right = `${bgRefImage.right/cvsWidth.value*100}%`
    }
    if(typeof bgRefImage.top === 'number'){
        res.top = `${bgRefImage.top/cvsHeight.value*100}%`
    }
    if(typeof bgRefImage.bottom === 'number'){
        res.bottom = `${bgRefImage.bottom/cvsHeight.value*100}%`
    }
    if(typeof bgRefImage.width === 'number'){
        res.width = `${bgRefImage.width/cvsWidth.value*100}%`
    }
    if(typeof bgRefImage.height === 'number'){
        res.height = `${bgRefImage.height/cvsHeight.value*100}%`
    }
    
    return res
})
const activeCvsInvisible = computed(()=> activeCvsDispatcher.noNeedActiveCvs)

onMounted(async()=>{
    await init()
})
onBeforeUnmount(()=>{
    enableContextMenu()
    window.clearInterval(activeCvsRenderTimer)
})

watch(somethingActive, (newVal)=>{
    if(newVal){
        activeCvsDispatcher.renderActiveCvs()
    }
})
defineExpose({init})
</script>

<template>
    <div class="cvsFrame" ref="cvsFrame">
        <div class="cvsCont" ref="cvsCont" :style="{backgroundColor: configStore.config.bgColor}">
            <div v-if="configStore.config.bgRefImage.url" class="bgRefImageDiv" :style="bgRefImageStyle">
                <img :src="configStore.config.bgRefImage.url"/>
            </div>
            <CvsBlocks :canvas-id-prefix="baseCvsDispatcher.canvasIdPrefix"></CvsBlocks>
            <CvsBlocks :canvas-id-prefix="mainCvsDispatcher.canvasIdPrefix"
                :cvs-class-name="'mainCvs'" :insnif="envStore.somethingActive"></CvsBlocks>
            <CvsBlocks :canvas-id-prefix="activeCvsDispatcher.canvasIdPrefix"
                :cvs-class-name="'activeCvs'" :invisible="activeCvsInvisible"></CvsBlocks>
        </div>
    </div>
    <Ops></Ops>
    <NameEdit></NameEdit>
    <TextTagEdit></TextTagEdit>
    <div v-if="pointLinkStore.isCreating" class="statusDisplay pointLinkCreatingStatus">
        正在创建连接，请点击第<b>{{ pointLinkStore.helpTextNumber }}</b>个点<br/>
        <button class="lite" @click="pointLinkStore.abortCreatingPtLink">取消创建</button>
    </div>
    <div v-if="selectionStore.showControl" class="statusDisplay selectionWorkingStatus">
        <button v-if="selectionStore.mode=='add'" @click="selectionStore.mode='sub'" class="selAddMode">
            添选模式</button>
        <button v-if="selectionStore.mode=='sub'" @click="selectionStore.mode='add'" class="selSubMode">
            减选模式</button>
        <span class="smallNote">移动视角请双指操作</span><br/>
        <button class="lite" @click="selectionStore.disableForTouchScreen">选择完成</button>
    </div>
    <div v-else-if="selectionStore.selected.size>0" class="statusDisplay selectionWorkingStatus">
        当前选中<b>{{ selectionStore.selected.size }}</b>个元素，可以拖拽<br/>
        <button v-if="selectionStore.showedControl" class="lite"
            @click="selectionStore.enableForTouchScreen('add')">加选</button>
        <button v-if="selectionStore.showedControl" class="lite"
            @click="selectionStore.enableForTouchScreen('sub')">减选</button>
        <button class="lite" @click="selectionStore.selected.clear()">退出多选模式</button>
    </div>
</template>

<style scoped lang="scss">
.cvsFrame{
    position: fixed;
    inset: 0px;
    overflow: scroll;
}
.cvsCont{
    transition: 0s;
    position: absolute;
    width: 1000px;
    height: 1000px;
    overflow: hidden;
}
.bgRefImageDiv{
    img{
        width: 100%;
        height: 100%;
    }
}
.pointLinkCreatingStatus, .selectionWorkingStatus{
    z-index: 1001;
    color: white;
    background-color: olivedrab;
    animation: greenBackgroundblink 1s infinite;
    $some-green: rgb(0, 80, 0);
    $lighter-green: rgb(0, 150, 0);
    will-change: background-color;
    @keyframes greenBackgroundblink {
        0% { background-color: $some-green; box-shadow: 0px 0px 10px 3px $some-green; }
        50% { background-color: $lighter-green; box-shadow: 0px 0px 10px 3px green;}
        100% { background-color: $some-green; box-shadow: 0px 0px 10px 3px $some-green; }
    }
    b{
        font-size: 26px;
        margin: 0px 2px 0px 2px;
    }
    button.lite{
        color:white;
        font-size: 14px;
        margin-top: 5px;
        border-bottom: 1px solid white;
        line-height: 16px;
        padding-bottom: 0px;
        margin-bottom: 2px;
        border-radius: 0px;
        &:hover{
            text-decoration: none;
        }
    }
}
.selectionWorkingStatus{
    .smallNote{
        margin-left: 5px;
        color: white;
    }
    button.selAddMode, button.selSubMode{
        background-color: white;
        color:rgb(0, 150, 0);
        padding: 2px;
        margin-bottom: 4px;
        font-weight: bold;
    }
    button.selSubMode{
        color: palevioletred;
    }
    button+button{
        margin-left: 1em;
    }
}
</style>