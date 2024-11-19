<script setup lang="ts">
import { OpsBtn, useOpsStore } from '@/models/stores/opsStore';
import { isSameCoord } from '@/utils/sgn';
import { storeToRefs } from 'pinia';
import { computed, CSSProperties, ref, watch } from 'vue';

const opsStore = useOpsStore()
const { show, clientPos, at, btns } = storeToRefs(opsStore)
const posAndShow = computed(()=>{return{show:show.value, clientPos:clientPos.value}})
const moveMs = 4
const dist = 10
const sunken = ref<boolean>(true);
let sinkTimer = 0
const opssStyle = ref<CSSProperties>({
    opacity:0
})
const btnsf = computed<OpsBtn[][]>(()=>{
    return btns.value?.filter(x=>x && x.length>0) || []
})
const height = computed<number>(()=>{
    if(btnsf.value.length == 0)
        return 8
    return 8 + Math.max(...btnsf.value.map(x=>x.length))*42
})
const width = computed<number>(()=>{
    return 8 + (btnsf.value?.filter(x=>x.length>0).length || 0)*42
})
watch(posAndShow, (newVal, oldVal) => {
    window.clearTimeout(sinkTimer)
    let showTurnedTrue = false
    if(newVal.show && !oldVal.show){
        showTurnedTrue = true
        window.setTimeout(()=>{
            sunken.value = false;
            opssStyle.value.opacity = 1
        }, moveMs)
    }else if(!newVal.show && oldVal.show){
        opssStyle.value.opacity = 0
        sinkTimer = window.setTimeout(()=>{
            sunken.value = true
        }, 200)
    }

    if (isSameCoord(newVal.clientPos, oldVal.clientPos)) {
        return
    }
    if (showTurnedTrue) {
        opssStyle.value.transition = '0s'
        window.setTimeout(() => {
            opssStyle.value.transition = undefined;
        }, moveMs / 2)
        showTurnedTrue = false;
    }
    let top: number, left: number;
    if (at.value == 'lb' || at.value == 'lt') {
        left = clientPos.value[0] - width.value - dist
    } else {
        left = clientPos.value[0] + dist
    }
    if (at.value == 'lt' || at.value == 'rt') {
        top = clientPos.value[1] - height.value - dist
    } else {
        top = clientPos.value[1] + dist
    }
    opssStyle.value.left = left
    opssStyle.value.top = top
})
watch(btns, ()=>{
    window.setTimeout(()=>{
        opssStyle.value.height = height.value;
        opssStyle.value.width = width.value;
    }, moveMs)
})
</script>

<template>
<div class="opss" :class="{sunken}" :style="opssStyle">
    <div v-for="bCol in btnsf" class="ops">
        <div v-for="b in bCol" @click="b.cb" :style="{backgroundColor: b.color}">{{ b.type }}</div>
    </div>
</div>
</template>

<style scoped lang="scss">
.opss{
    position: fixed;
    background-color: rgba($color: #fff, $alpha: 0.9);
    border-radius: 10px;
    box-shadow: 0px 0px 5px 0px black;
    display: flex;
    justify-content: center;
    gap: 2px
}
.ops{
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 2px;
    overflow: hidden;
    margin-top: 4px;
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