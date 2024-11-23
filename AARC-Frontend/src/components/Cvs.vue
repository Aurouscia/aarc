<script setup lang="ts">
import { useEnvStore } from '@/models/stores/envStore';
import { storeToRefs } from 'pinia';
import { onMounted, nextTick, computed } from 'vue';
import Ops from './Ops.vue';
import Name from './NameEdit.vue';
import { useActiveCvsDispatcher } from '@/models/cvs/dispatchers/activeCvsDispatcher';
import { useBaseCvsDispatcher } from '@/models/cvs/dispatchers/baseCvsDispatcher';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import { useConfigStore } from '@/models/stores/configStore';
import { useCvsFrameStore } from '@/models/stores/cvsFrameStore';

const envStore = useEnvStore();
const configStore = useConfigStore();
const { cvsWidth, cvsHeight } = storeToRefs(useEnvStore())
const { cvsFrame, cvsCont } = storeToRefs(useCvsFrameStore())
const { baseCvs } = useBaseCvsDispatcher()
const { mainCvs, renderMainCvs } = useMainCvsDispatcher()
const { activeCvs, renderActiveCvs } = useActiveCvsDispatcher()
const mainCvsInsnif = computed<boolean>(()=>
    !!envStore.activePt || !!envStore.activeLine
)

onMounted(async()=>{
    if(cvsCont.value && cvsFrame.value){
        cvsCont.value.style.width = cvsWidth.value+'px'
        cvsCont.value.style.height = cvsHeight.value+'px'
    }
    await nextTick()
    envStore.init()
    configStore.readConfigFromSave()
    renderMainCvs()
    setInterval(()=>{
        renderActiveCvs()
    }, 50)
    document.oncontextmenu = function(e){
        e.preventDefault()
    }
})

</script>

<template>
    <div class="cvsFrame" ref="cvsFrame">
        <div class="cvsCont" ref="cvsCont" :style="{backgroundColor: configStore.config.bgColor}">
            <canvas ref="baseCvs" :width="cvsWidth" :height="cvsHeight"></canvas>
            <canvas ref="mainCvs" :width="cvsWidth" :height="cvsHeight" :class="{insnif: mainCvsInsnif}"></canvas>
            <canvas ref="activeCvs" :width="cvsWidth" :height="cvsHeight"></canvas>
        </div>
    </div>
    <Ops></Ops>
    <Name></Name>
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