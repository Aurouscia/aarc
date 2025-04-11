<script setup lang="ts">
import { computed, CSSProperties, ref } from 'vue';

const coverStyle = ref<CSSProperties>();
const barStyle = ref<CSSProperties>();
const showing = ref<boolean>(false);
const props = defineProps<{
    width?:number,
    shrinkWay?:'v-if'|'v-show',
    enforceYScroll?:boolean
}>()
const width = props.width? props.width+'px' : '300px';
const foldedRight = '-'+width;
const onlyHideWhenShrink = computed<boolean>(()=>props.shrinkWay=='v-show')

barStyle.value = {
    width:width,
    right:foldedRight
}

let movingTimer:number = 0
let folding:boolean = false
function extend(){
    if(showing.value && !folding)
        return
    folding = false
    window.clearTimeout(movingTimer)
    showing.value = true;
    coverStyle.value = {
        display:'block',
        opacity:0
    }
    barStyle.value = {
        right:'0px',
        width,
        boxShadow: '0px 0px 10px 0px black'
    }
    movingTimer = window.setTimeout(()=>{
        coverStyle.value={
            display:'block',
            opacity:0.3
        }
    },1)
    emit('extend');
}
function fold(){
    if(!showing.value || folding)
        return
    folding = true
    window.clearTimeout(movingTimer)
    coverStyle.value = {
        display:'block',
        opacity:0,
        pointerEvents:'none'
    }
    barStyle.value = {
        right: foldedRight,
        width,
        boxShadow:'none'
    }
    movingTimer = window.setTimeout(()=>{
        coverStyle.value = {}
        showing.value = false;
        folding = false
    },300)
    emit('fold');
}
defineExpose({extend,fold})
const emit = defineEmits<{
    (e:'extend'):void
    (e:'fold'):void
}>()
</script>

<template>
<div class="sidebarOuter">
    <div class="cover" :style="coverStyle" @click="fold"></div>
    <div class="sideBar" :style="barStyle">
        <div class="body" v-show="showing" :style="{overflowY:enforceYScroll?'scroll':'auto'}">
            <slot v-if="showing || onlyHideWhenShrink" ></slot>
        </div>
    </div>
</div>
</template>

<style scoped>
.sideBar button{
    margin-bottom: 10px;
}
.body{
    padding: 10px;
    overflow-y: auto;
    height: 100vh;
    position: relative;
}
.sideBar{
    position: fixed;
    top:0px;
    bottom: 0px;
    display: flex;
    flex-direction: column;
    transition: 0.3s;
    background-color: white;
    box-shadow: none;
    z-index: 1001;
}
.cover{
    opacity: 0;
    background-color: black;
    position: fixed;
    top: 0px;bottom:0px;
    left: 0px;right:0px;
    display: none;
    transition: 0.3s;
    z-index: 1000;
}
</style>