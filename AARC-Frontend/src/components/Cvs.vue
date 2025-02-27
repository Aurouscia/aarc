<script setup lang="ts">
import { useEnvStore } from '@/models/stores/envStore';
import { storeToRefs } from 'pinia';
import { onMounted, nextTick, watch, onBeforeUnmount, computed, CSSProperties } from 'vue';
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

const envStore = useEnvStore();
const { somethingActive } = storeToRefs(envStore)
const { cvsWidth, cvsHeight } = storeToRefs(useSaveStore())
const configStore = useConfigStore();
const cvsFrameStore = useCvsFrameStore()
const { cvsFrame, cvsCont } = storeToRefs(cvsFrameStore)
const baseCvsDispatcher = useBaseCvsDispatcher()
const mainCvsDispatcher = useMainCvsDispatcher()
const activeCvsDispatcher = useActiveCvsDispatcher()
const { wait } = storeToRefs(useUniqueComponentsStore())
const cvsBlocksControlStore = useCvsBlocksControlStore()

let activeCvsRenderTimer = 0
async function init(){
    window.clearInterval(activeCvsRenderTimer)
    wait.value?.setShowing(true)
    cvsFrameStore.initContSizeStyle()
    await nextTick()
    envStore.init()
    cvsBlocksControlStore.refreshBlocks('suppress')
    await nextTick()
    configStore.readConfigFromSave()
    baseCvsDispatcher.renderBaseCvs()
    mainCvsDispatcher.renderMainCvs({suppressRenderedCallback:true})
    cvsBlocksControlStore.blocksControlInit()
    activeCvsRenderTimer = window.setInterval(()=>{
        activeCvsDispatcher.renderActiveCvs()
    }, 50)
    disableContextMenu()
    wait.value?.setShowing(false)
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
                :cvs-class-name="'activeCvs'" :invisible="!envStore.somethingActive"></CvsBlocks>
        </div>
    </div>
    <Ops></Ops>
    <NameEdit></NameEdit>
    <TextTagEdit></TextTagEdit>
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
</style>