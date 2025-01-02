<script setup lang="ts">
import { CSSProperties, onMounted, onUnmounted, ref } from 'vue';

const showRetryBtn = ref<boolean>(false);
function retry(){
    location.reload()
}

const contentStyle = ref<CSSProperties>();
function cycle(){
    contentStyle.value = {
        left:'-300px',
        transition:'0s'
    }
    window.setTimeout(()=>{
        contentStyle.value = {
            left:'calc(100% + 80px)',
            transition:'1s'
        };
    },10)
}
var cycleTimer:number=0;
var showRetryTimer:number=0;
onMounted(()=>{
    cycle();
    cycleTimer = window.setInterval(cycle,1100);
    showRetryTimer = window.setTimeout(()=>{
        showRetryBtn.value = true;
    },5000)
})
onUnmounted(()=>{
    window.clearInterval(cycleTimer);
    window.clearTimeout(showRetryTimer)
})
</script>

<template>
    <div class="loading">
        <div :style="contentStyle" class="loadingContent" ref="content"></div>
    </div>
    <div class="loading">
        <div :style="contentStyle" class="loadingContent" ref="content"></div>
    </div>
    <div class="retry" v-show="showRetryBtn">
        <button class="minor" @click="retry">尝试重新加载</button>
    </div>
</template>

<style scoped>
    .retry{
        text-align: center;
        margin-top: 15px;
    }
    .loading{
        position: relative;
        background-color: #ccc;
        border:2px solid #ccc;
        height:1em;
        overflow: hidden;
        margin-top: 15px;
    }
    .loadingContent{
        position: absolute;
        top: 0px;
        bottom: 0px;
        width: 100px;
        background-color: white;
        box-shadow: 0px 0px 40px 40px white;
    }
</style>