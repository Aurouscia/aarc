<script setup lang="ts">
import { useActiveCvsDispatcher } from '@/models/cvs/dispatchers/activeCvsDispatcher';
import { useBaseCvsDispatcher } from '@/models/cvs/dispatchers/baseCvsDispatcher';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { useEnvStore } from '@/models/stores/envStore';
import { bgColor } from '@/utils/consts';
import { storeToRefs } from 'pinia';
import { onMounted, nextTick } from 'vue';

const envStore = useEnvStore();
const { cvsFrame, cvsCont, cvsWidth, cvsHeight } = storeToRefs(useEnvStore())
const { baseCvs, renderBaseCvs } = useBaseCvsDispatcher()
const { mainCvs, renderMainCvs } = useMainCvsDispatcher()
const { activeCvs, renderActiveCvs } = useActiveCvsDispatcher()

const testWidth = 1000
const testHeight = 1000

onMounted(async()=>{
    cvsWidth.value = testWidth
    cvsHeight.value = testHeight
    if(cvsCont.value && cvsFrame.value){
        cvsCont.value.style.width = cvsWidth.value+'px'
        cvsCont.value.style.height = cvsHeight.value+'px'
    }
    await nextTick()
    envStore.init()
    renderBaseCvs()
    renderMainCvs()
    setInterval(()=>{
        renderActiveCvs()
    }, 100)
})

</script>

<template>
    <div class="cvsFrame" ref="cvsFrame">
        <div class="cvsCont" ref="cvsCont" :style="{backgroundColor: bgColor}">
            <canvas ref="baseCvs" :width="cvsWidth" :height="cvsHeight"></canvas>
            <canvas ref="mainCvs" :width="cvsWidth" :height="cvsHeight" :class="{insnif: envStore.activePtId}"></canvas>
            <canvas ref="activeCvs" :width="cvsWidth" :height="cvsHeight"></canvas>
        </div>
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
    canvas{
        width: 100%;
        height: 100%;
        position: absolute;
        inset: 0px;
    }
}
.insnif{
    opacity: 0.2;
}
</style>