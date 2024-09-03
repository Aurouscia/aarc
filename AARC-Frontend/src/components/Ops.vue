<script setup lang="ts">
import { useOpsStore } from '@/models/stores/opsStore';
import { isSameCoord } from '@/utils/sgn';
import { storeToRefs } from 'pinia';
import { computed, CSSProperties, ref, watch } from 'vue';

const opsStore = useOpsStore()
const { show, clientPos, at, btns } = storeToRefs(opsStore)
const posAndShow = computed(()=>{return{show:show.value, clientPos:clientPos.value}})
const moveMs = 4
const width = 50
const dist = 10
const sunken = ref<boolean>(true);
let sinkTimer = 0
const opsStyle = ref<CSSProperties>({
    width,
    opacity:0
})
const height = computed<number>(()=>{
    return 7+btns.value.length*42
})
watch(posAndShow, (newVal, oldVal) => {
    window.clearTimeout(sinkTimer)
    let showTurnedTrue = false
    if(newVal.show && !oldVal.show){
        showTurnedTrue = true
        window.setTimeout(()=>{
            sunken.value = false;
            opsStyle.value.opacity = 1
        }, moveMs)
    }else if(!newVal.show && oldVal.show){
        opsStyle.value.opacity = 0
        sinkTimer = window.setTimeout(()=>{
            sunken.value = true
        }, 200)
    }

    if (isSameCoord(newVal.clientPos, oldVal.clientPos)) {
        return
    }
    if (showTurnedTrue) {
        opsStyle.value.transition = '0s'
        window.setTimeout(() => {
            opsStyle.value.transition = undefined;
        }, moveMs / 2)
        showTurnedTrue = false;
    }
    let top: number, left: number;
    if (at.value == 'lb' || at.value == 'lt') {
        left = clientPos.value[0] - width - dist
    } else {
        left = clientPos.value[0] + dist
    }
    if (at.value == 'lt' || at.value == 'rt') {
        top = clientPos.value[1] - height.value - dist
    } else {
        top = clientPos.value[1] + dist
    }
    opsStyle.value.left = left
    opsStyle.value.top = top
})
watch(btns, ()=>{
    window.setTimeout(()=>{
        opsStyle.value.height = height.value;
    }, moveMs)
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
    overflow: hidden;
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