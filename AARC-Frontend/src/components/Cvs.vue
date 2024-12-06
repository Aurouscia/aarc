<script setup lang="ts">
import { useEnvStore } from '@/models/stores/envStore';
import { storeToRefs } from 'pinia';
import { onMounted, nextTick, watch } from 'vue';
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
const { cvsFrame, cvsCont } = storeToRefs(useCvsFrameStore())
const { baseCvs } = storeToRefs(useBaseCvsDispatcher())
const mainCvsDispatcher = useMainCvsDispatcher()
const { mainCvs } = storeToRefs(mainCvsDispatcher)
const activeCvsDispatcher = useActiveCvsDispatcher()
const { activeCvs } = storeToRefs(activeCvsDispatcher)

onMounted(async()=>{
    if(cvsCont.value && cvsFrame.value){
        cvsCont.value.style.width = cvsWidth.value+'px'
        cvsCont.value.style.height = cvsHeight.value+'px'
    }
    await nextTick()
    envStore.init()
    configStore.readConfigFromSave()
    mainCvsDispatcher.renderMainCvs()
    setInterval(()=>{
        activeCvsDispatcher.renderActiveCvs()
    }, 50)
    document.oncontextmenu = function(e){
        e.preventDefault()
    }
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
@use '../styleVals.scss';

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
    transition-timing-function: cubic-bezier(1, 0, 1, 0);//出现地越快越好
    &.insnif{
        transition-timing-function: cubic-bezier(0, 1, 0, 1);//消失地越慢越好
        opacity: 0.2;
    }
}
.activeCvs{
    transition: 0s;//瞬间出现
    &.invisible{
        transition: styleVals.$default-transition-time;
        transition-timing-function: cubic-bezier(1, 0, 1, 0);//快速消失
        opacity: 0;
    }
}
</style>