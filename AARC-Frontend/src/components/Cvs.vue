<script setup lang="ts">
import { useEnvStore } from '@/models/stores/envStore';
import { storeToRefs } from 'pinia';
import { onMounted, nextTick, watch, onBeforeUnmount } from 'vue';
import Ops from './Ops.vue';
import Name from './NameEdit.vue';
import { useActiveCvsDispatcher } from '@/models/cvs/dispatchers/activeCvsDispatcher';
import { useBaseCvsDispatcher } from '@/models/cvs/dispatchers/baseCvsDispatcher';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { useConfigStore } from '@/models/stores/configStore';
import { useCvsFrameStore } from '@/models/stores/cvsFrameStore';

const envStore = useEnvStore();
const { somethingActive } = storeToRefs(envStore)
const configStore = useConfigStore();
const { cvsWidth, cvsHeight } = storeToRefs(useEnvStore())
const cvsFrameStore = useCvsFrameStore()
const { cvsFrame, cvsCont } = storeToRefs(cvsFrameStore)
const baseCvsDispatcher = useBaseCvsDispatcher()
const { baseCvs } = storeToRefs(baseCvsDispatcher)
const mainCvsDispatcher = useMainCvsDispatcher()
const { mainCvs } = storeToRefs(mainCvsDispatcher)
const activeCvsDispatcher = useActiveCvsDispatcher()
const { activeCvs } = storeToRefs(activeCvsDispatcher)
let activeCvsRenderTimer = 0

onMounted(async()=>{
    cvsFrameStore.setSizeToCvsContStyle()
    await nextTick()
    envStore.init()
    configStore.readConfigFromSave()
    baseCvsDispatcher.renderBaseCvs()
    mainCvsDispatcher.renderMainCvs(undefined, undefined, true)
    activeCvsRenderTimer = window.setInterval(()=>{
        activeCvsDispatcher.renderActiveCvs()
    }, 50)
    document.oncontextmenu = function(e){
        e.preventDefault()
    }
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
</script>

<template>
    <div class="cvsFrame" ref="cvsFrame">
        <div class="cvsCont" ref="cvsCont" :style="{backgroundColor: configStore.config.bgColor}">
            <canvas ref="baseCvs" :width="cvsWidth" :height="cvsHeight"></canvas>
            <canvas ref="mainCvs" :width="cvsWidth" :height="cvsHeight" :class="{insnif: envStore.somethingActive}" class="mainCvs"></canvas>
            <canvas ref="activeCvs" :width="cvsWidth" :height="cvsHeight" :class="{invisible: !envStore.somethingActive}" class="activeCvs"></canvas>
        </div>
    </div>
    <Ops></Ops>
    <Name></Name>
</template>

<style scoped lang="scss">
@use '@/styles/globalValues';
@use '@/styles/globalMixins';

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
    canvas{
        width: 100%;
        height: 100%;
        position: absolute;
        inset: 0px;
        transition-timing-function: linear;
    }
}
.mainCvs{
    @include globalMixins.trans-quick-in(0.9);//出现地越快越好
    &.insnif{
        @include globalMixins.trans-slow-in(0.9);//消失地越慢越好
        opacity: 0.4;
    }
}
.activeCvs{
    transition: 0s;//瞬间出现
    &.invisible{
        transition: globalValues.$default-transition-time;
        @include globalMixins.trans-slow-in(0.5);//慢速消失
        opacity: 0;
    }
}
</style>