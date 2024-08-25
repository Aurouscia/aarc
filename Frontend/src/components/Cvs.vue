<script setup lang="ts">
import { useBaseCvs } from '@/models/cvs/baseCvs';
import { useLineCvs } from '@/models/cvs/lineCvs';
import { usePointCvs } from '@/models/cvs/pointCvs';
import { bgColor } from '@/utils/consts';
import { simpleGrid } from '@/utils/grid';
import { Scaler } from '@/utils/scaler';
import { onMounted, ref, nextTick } from 'vue';

const cvsFrame = ref<HTMLDivElement>()
const cvsCont = ref<HTMLDivElement>()

const { cvs:baseCvs } = useBaseCvs()
const { cvs:lineCvs, renderAllLines } = useLineCvs()
const { cvs:pointCvs, renderAllPoints } = usePointCvs()

const cvsWidth = ref<number>()
const cvsHeight = ref<number>()
const testWidth = 1000
const testHeight = 1000

function drawTestGrid(){
    const ctx = baseCvs.value?.getContext('2d')
    if(!ctx)
        return;
    simpleGrid(ctx)
}

let scaler:Scaler;

onMounted(async()=>{
    cvsWidth.value = testWidth
    cvsHeight.value = testHeight
    if(cvsCont.value && cvsFrame.value){
        cvsCont.value.style.width = cvsWidth.value+'px'
        cvsCont.value.style.height = cvsHeight.value+'px'
        scaler = new Scaler(cvsFrame.value, cvsCont.value, ()=>{})
        scaler.widthReset()
    }
    await nextTick()
    drawTestGrid()
    renderAllLines()
    renderAllPoints()
})

</script>

<template>
    <div class="cvsFrame" ref="cvsFrame">
        <div class="cvsCont" ref="cvsCont" :style="{backgroundColor: bgColor}">
            <canvas ref="baseCvs" :width="cvsWidth" :height="cvsHeight"></canvas>
            <canvas ref="lineCvs" :width="cvsWidth" :height="cvsHeight"></canvas>
            <canvas ref="pointCvs" :width="cvsWidth" :height="cvsHeight"></canvas>
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
</style>