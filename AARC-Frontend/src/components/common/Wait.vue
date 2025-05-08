<script setup lang="ts">
import { computed, ref } from 'vue';

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
defineExpose({
    setShowing
});
</script>

<template>
<div class="wait" :class="{showing}">
    <div class="shadowDiv">
        <div class="spinner"></div>
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
    left: calc(50% - 25px);
    width: 50px;
    height: 50px;
    border-radius: 1000px;
    animation: none;
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
    }
}
</style>