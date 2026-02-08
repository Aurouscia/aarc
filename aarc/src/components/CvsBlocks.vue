<script setup lang="ts">
import { useCvsBlocksControlStore } from '@/models/cvs/common/cvs';
import { storeToRefs } from 'pinia';
import { computed, CSSProperties } from 'vue';

const props = defineProps<{
    canvasIdPrefix:string,
    cvsClassName?:'mainCvs'|'activeCvs',
    insnif?:boolean
    invisible?:boolean
}>()
const classes = computed(()=>{
    const res:string[] = []
    if(props.cvsClassName)
        res.push(props.cvsClassName)
    if(props.insnif)
        res.push('insnif')
    if(props.invisible)
        res.push('invisible')
    return res
})
const cvsBlocksControlStore = useCvsBlocksControlStore()
const { blocksControl } = storeToRefs(cvsBlocksControlStore)
const blocks = computed<{id:string, styles:CSSProperties, w:number, h:number, key:number}[]>(()=>{
    return blocksControl.value.map(x=>{
        const styles:CSSProperties = {
            width: `${x.widthRatio*100}%`,
            height: `${x.heightRatio*100}%`,
            left: `${x.leftRatio*100}%`,
            top: `${x.topRatio*100}%`
        }
        return{
            id: `${props.canvasIdPrefix}${x.idx}`,
            styles,
            w: x.canvasWidth,
            h: x.canvasHeight,
            key:x.key
        }
    })
})
</script>

<template>
    <canvas v-for="b in blocks" :id="b.id" :style="b.styles" :key="b.key"
        :width="b.w" :height="b.h"
        :class="classes"></canvas>
</template>

<style scoped lang="scss">
@use '@/styles/globalValues';
@use '@/styles/globalMixins';

canvas {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0px;
    transition-timing-function: linear;
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