<script setup lang="ts">
import { useOpsStore } from '@/models/stores/opsStore';
import { storeToRefs } from 'pinia';
import { computed, CSSProperties, ref } from 'vue';

const opsStore = useOpsStore()
const { show, clientPos, at, btns } = storeToRefs(opsStore)
const width = 50
const dist = 10
const sunken = ref<boolean>(true);
let sinkTimer = 0
const opsStyle = computed<CSSProperties>(()=>{
    window.clearTimeout(sinkTimer)
    sunken.value = false
    let opacity = 1;
    if(!show.value || btns.value.length==0){
        opacity = 0;
        sinkTimer = window.setTimeout(()=>{
            sunken.value = true
        }, 100)
    }
    let height = 7+btns.value.length*42
    let top:number, left:number;
    if(at.value == 'lb' || at.value == 'lt'){
        left = clientPos.value[0] - width - dist
    }else{
        left = clientPos.value[0] + dist
    }
    if(at.value == 'lt' || at.value == 'rt'){
        top = clientPos.value[1] - height - dist
    }else{
        top = clientPos.value[1] + dist
    }
    return {
        opacity,
        top, left, 
        width, height
    }
})
</script>

<template>
<div class="ops" :class="{sunken}" :style="opsStyle">
    <div v-for="b in btns" @click="b.cb">{{ b.type }}</div>
</div>
</template>

<style scoped lang="scss">
.ops{
    position: fixed;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0px 0px 5px 0px black;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 2px;
    div{
        width: 40px;
        height: 40px;
        background-color: #ccc;
        border-radius: 5px;
        user-select: none;
        line-height: 40px;
        text-align: center;
    }
}
.sunken{
    z-index: -1;
}
</style>