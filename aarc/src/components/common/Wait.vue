<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { apiWaitKeyPrefix, apiCancelableMs, useApiStore } from '@/app/com/apiStore';

const showReasons = ref<Set<string>>(new Set())
const showing =  computed(()=>{
    return showReasons.value.size > 0;
})
function setShowing(reason:string, value: boolean){
    if(value){
        showReasons.value.add(reason); 
    }else{
        showReasons.value.delete(reason);
    }
}

const apiStore = useApiStore()
const showCancelBtn = ref(false)
const anyApiWaiting = computed(()=>{
    return [...showReasons.value].some(x=>x.startsWith(apiWaitKeyPrefix));
})
const waitStartAt = ref(0);
let waitTimeTooLongCheckTimer:number = 0
watch(anyApiWaiting, (newValue)=>{
    window.clearInterval(waitTimeTooLongCheckTimer)
    if(newValue){
        waitStartAt.value = Date.now();
        waitTimeTooLongCheckTimer = window.setInterval(()=>{
            if(Date.now() - waitStartAt.value > apiCancelableMs){
                showCancelBtn.value = true;
                window.clearInterval(waitTimeTooLongCheckTimer)
            } 
        }, 100)
    }
    else{
        showCancelBtn.value = false;
    }
})
defineExpose({
    setShowing
});
</script>

<template>
<div class="wait" :class="{showing}">
    <div class="shadowDiv">
        <div class="spinner"></div>
        <button v-if="showCancelBtn" class="cancelWaiting danger" @click="apiStore.abortAll">
            取消
        </button>
    </div>
</div>
</template>

<style scoped lang="scss">
.wait{
    position: fixed;
    top:100vh;
    left: 0px;
    right: 0px;
    height: 100vh;
    z-index: 50000;
    transition: 0s;
}
.shadowDiv {
    position: fixed;
    left: 0px;
    right: 0px;
    height: 100px;
    bottom: -100px;
    z-index: 50001;
    box-shadow: 0px 0px 0px 0px black;
}
.spinner {
    position: absolute;
    top: 0px;
    border: 10px solid white;
    border-top: 10px solid cornflowerblue;
    box-sizing: border-box;
    left: calc(50% - 35px);
    width: 70px;
    height: 70px;
    border-radius: 1000px;
    animation: none;
}
.cancelWaiting{
    position: absolute;
    bottom: 120px;
    width: 100px;
    box-sizing: border-box;
    left: calc(50% - 50px);
    transition: 0.5s;
    opacity: 0;
    z-index: 50002;
    border: 2px solid white;
}
.wait.showing{
    top:0px;
    .shadowDiv{
        box-shadow: 0px 0px 300px 100px black;
        transition: 0.5s;
        .spinner{
            transition: 0.5s;
            -webkit-animation: spin 2s cubic-bezier(0.9, 0.1, 0.1, 0.9) infinite;
            animation: spin 2s cubic-bezier(0.9, 0.1, 0.1, 0.9) infinite;
            top: -200px; 
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        }
        .cancelWaiting{
            opacity: 1;
        }
    }
}
</style>