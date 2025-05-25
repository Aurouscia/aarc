<script setup lang="ts">
import { computed, CSSProperties, ref } from 'vue'

const props = defineProps<{
    initial?:'left'|'right',
    leftColor?:string,
    rightColor?:string,
    leftText?:string,
    rightText?:string,
    sliderWidthPx?:number,
}>()
const emit = defineEmits<{
    (e:'left'):void,
    (e:'right'):void,
}>()

const status = ref<'left'|'right'>(props.initial??'left')
function toggle(){
    status.value = status.value==='left'?'right':'left'
    if(status.value==='left'){
        emit('left')
    }else{
        emit('right')
    }
}

const sliderContainerWidthPx = 55
const sliderContainerHeightPx = 24
const sliderContainerPaddingPx = 3
const defaultSliderWidthPx = 40
const color = computed(()=>{
    return status.value==='left' 
        ? (props.leftColor ?? '#999') 
        : (props.rightColor ?? '#999') 
})
const text = computed(()=>{
    return status.value==='left'
       ? (props.leftText?? '左')
        : (props.rightText?? '右')
})
const sliderContainerStyles = computed<CSSProperties>(()=>{
    return {
        width:sliderContainerWidthPx+'px',
        height:sliderContainerHeightPx+'px',
        padding:sliderContainerPaddingPx+'px',
        backgroundColor:color.value
    }
})
const sliderStyles = computed<CSSProperties>(()=>{
    const sliderWidthPx = props.sliderWidthPx??defaultSliderWidthPx
    let left = sliderContainerPaddingPx
    if(status.value==='right'){
        left = sliderContainerWidthPx-sliderWidthPx+sliderContainerPaddingPx
    }
    return {
        width:sliderWidthPx+'px',
        left:left+'px',
        height:sliderContainerHeightPx+'px',
        color:color.value,
    }
})
</script>

<template>
<div class="switch">
    <div class="sliderContainer" @click="toggle" :style="sliderContainerStyles">
        <div class="slider" :style="sliderStyles">{{ text }}</div>
    </div>
</div>
</template>

<style scoped lang="scss">
.switch{
    display: flex;
    align-items: center;
    gap: 4px;
    .sliderContainer{
        position: relative;
        border-radius: 10px;
        cursor: pointer;
        .slider{
            user-select: none;
            font-size: 16px;
            text-align: center;
            position: absolute;
            border-radius: 7px;
            background-color: white;
            transition:cubic-bezier(0.215, 0.610, 0.355, 1) .2s;
        }
    }
}
</style>