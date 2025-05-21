<script setup lang="ts">
import { computed, CSSProperties, ref } from 'vue'

const props = defineProps<{
    initial?:'left'|'right',
    leftColor?:string,
    rightColor?:string,
    leftText?:string,
    rightText?:string,
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

const sliderContainerWidthPx = 30
const sliderContainerHeightPx = 16
const sliderContainerPaddingPx = 3
const sliderWidthPx = 16
const color = computed(()=>{
    return status.value==='left' 
        ? (props.leftColor ?? '#aaa') 
        : (props.rightColor ?? '#aaa') 
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
    let left = sliderContainerPaddingPx
    if(status.value==='right'){
        left = sliderContainerWidthPx-sliderWidthPx+sliderContainerPaddingPx
    }
    return {
        width:sliderWidthPx+'px',
        left:left+'px',
        height:sliderContainerHeightPx+'px',
    }
})
</script>

<template>
<div class="switch">
    <div class="sliderContainer" @click="toggle" :style="sliderContainerStyles">
        <div class="slider" :style="sliderStyles"></div>
    </div>
    <div :style="{color:color}" class="switchText">{{ text }}</div>
</div>
</template>

<style scoped lang="scss">
.switch{
    display: flex;
    align-items: center;
    gap: 4px;
    .sliderContainer{
        position: relative;
        height: 20px;
        border-radius: 10px;
        cursor: pointer;
        .slider{
            position: absolute;
            border-radius: 7px;
            background-color: white;
            transition:cubic-bezier(0.215, 0.610, 0.355, 1) .2s;
        }
    }
    .switchText{
        font-size: 14px;
    }
}
</style>