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

const envStore = useEnvStore();
const { somethingActive } = storeToRefs(envStore)
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
    cvsBlocksControlStore.refreshBlocks(true)
    await nextTick()
    configStore.readConfigFromSave()
    baseCvsDispatcher.renderBaseCvs()
    mainCvsDispatcher.renderMainCvs({suppressRenderedCallback:true})
    cvsBlocksControlStore.blocksControlInit()
    activeCvsRenderTimer = window.setInterval(()=>{
        activeCvsDispatcher.renderActiveCvs()
    }, 50)
    document.oncontextmenu = function(e){
        e.preventDefault()
    }
    wait.value?.setShowing(false)
}
const bgRefImageStyle = computed<CSSProperties>(()=>{
    const bgRefImage = configStore.config.bgRefImage
    const opacityNum = bgRefImage.opacity ? parseInt(bgRefImage.opacity.toString()) : NaN
    return {
        position: 'absolute',
        opacity: !isNaN(opacityNum) ? `${opacityNum/100}` : undefined,
        left: typeof bgRefImage.left=='number' ? `${bgRefImage.left}%` : undefined,
        top: typeof bgRefImage.top=='number' ? `${bgRefImage.top}%` : undefined,
        right: typeof bgRefImage.right=='number' ? `${bgRefImage.right}%` : undefined,
        bottom: typeof bgRefImage.bottom=='number' ? `${bgRefImage.bottom}%` : undefined,
    }
})

onMounted(async()=>{
    await init()
})
onBeforeUnmount(()=>{
    document.oncontextmenu = null
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