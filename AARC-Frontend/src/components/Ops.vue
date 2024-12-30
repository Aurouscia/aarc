<script setup lang="ts">
import { Coord } from '@/models/coord';
import { useColorProcStore } from '@/models/stores/colorProcStore';
import { OpsBtn, useOpsStore } from '@/models/stores/opsStore';
import { storeToRefs } from 'pinia';
import { computed, CSSProperties, ref, watch } from 'vue';

const opsStore = useOpsStore()
const { colorProcInvBinary } = useColorProcStore()
const { clientPos, at, btns } = storeToRefs(opsStore)
const moveMs = 4
const dist = 12
const sunken = ref<boolean>(true);
let sinkTimer = 0
const opssStyle = ref<CSSProperties>({
    opacity:0
})
const opsStyle = ref<CSSProperties>({})

const sizeIgnoreBtns = ref(false)
const btnsf = computed<OpsBtn[][]>(()=>{
    return btns.value?.filter(x=>x && x.length>0) || []
})
const firstBtnHalf = 24
const height = computed<number>(()=>{
    if(btnsf.value.length == 0 || sizeIgnoreBtns.value)
        return 8
    return 8 + Math.max(...btnsf.value.map(x=>x.length))*42
})
const width = computed<number>(()=>{
    if(sizeIgnoreBtns.value)
        return 8
    return 8 + btnsf.value.length*42
})

watch(clientPos, (newVal, oldVal)=>{
    if(!newVal && !oldVal)
        return;
    window.clearTimeout(sinkTimer)
    if(newVal && !oldVal) {
        opssStyle.value.transition = '0s'
        sizeIgnoreBtns.value = true
        applyFlex()
        applyPos(newVal)
        applySize()
        window.setTimeout(() => {
            opssStyle.value.transition = undefined
            sunken.value = false;
            opssStyle.value.opacity = 1
            sizeIgnoreBtns.value = false
            applyPos(newVal)
            applySize()
        }, moveMs)
    }else if(!newVal && oldVal) {
        opssStyle.value.opacity = 0
        sizeIgnoreBtns.value = true
        applyPos(oldVal)
        applySize()
        sinkTimer = window.setTimeout(() => {
            sizeIgnoreBtns.value = false
            sunken.value = true
        }, 200)
    }
    else{
        applyFlex()
        applyPos(newVal!)
        applySize()
    }
})
watch(btns, ()=>{
    applySize()
})
function applyPos(clientPos:Coord){
    opssStyle.value.left = opCssLeft(clientPos[0])+'px'
    opssStyle.value.top = opCssTop(clientPos[1])+'px'
}
function applySize(){
    opssStyle.value.height = height.value;
    opssStyle.value.width = width.value;
}

const vertAtDistRatio = 1.7
function opCssLeft(clientPosX:number){
    if(at.value == 'l')
        return clientPosX - width.value - dist*vertAtDistRatio
    if (at.value == 'lb' || at.value == 'lt') 
        return clientPosX - width.value - dist
    else if(at.value == 't' || at.value == 'b')
        return clientPosX - firstBtnHalf
    else if(at.value == 'rb' || at.value == 'rt')
        return clientPosX + dist
    return clientPosX + dist*vertAtDistRatio
}
function opCssTop(clientPosY:number){
    if(at.value == 't')
        return clientPosY - height.value - dist*vertAtDistRatio
    if (at.value == 'lt' || at.value == 'rt') 
        return clientPosY - height.value - dist
    else if(at.value == 'l' || at.value == 'r')
        return clientPosY - firstBtnHalf
    else if(at.value == 'lb' || at.value == 'rb')
        return clientPosY + dist
    return clientPosY + dist*vertAtDistRatio
}

function applyFlex(){
    if(at.value == 'l' || at.value == 'lt' || at.value == 'lb')
        opssStyle.value.flexDirection = 'row-reverse'
    else
        opssStyle.value.flexDirection = 'row'

    if(at.value == 'l' || at.value == 'r'){
        opsStyle.value.justifyContent = 'center'
        opsStyle.value.flexDirection = 'column'
    }
    else if(at.value == 't' || at.value == 'lt' || at.value == 'rt'){
        opsStyle.value.justifyContent = 'flex-start'
        opsStyle.value.flexDirection = 'column-reverse'
    }
    else{
        opsStyle.value.justifyContent = 'flex-start'
        opsStyle.value.flexDirection = 'column'
    }
}
</script>

<template>
<div class="opss" :class="{sunken}" :style="opssStyle">
    <div v-for="bCol in btnsf" class="ops" :style="opsStyle">
        <div v-for="b in bCol" @click="b.cb" :style="{backgroundColor: b.color, color:colorProcInvBinary.convert(b.color)}">
            {{ b.text }}
            <div v-if="b.textSub" class="opBtnTextSub">{{ b.textSub }}</div>
        </div>
    </div>
</div>
</template>

<style scoped lang="scss">
.opBtnTextSub{
    font-size: 8px;
    line-height: 10px;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    position: absolute;
    bottom: 1px;
    left: 0px;
    right: 0px;
}
.opss{
    position: fixed;
    background-color: rgba($color: #fff, $alpha: 0.85);
    border-radius: 10px;
    box-shadow: 0px 0px 5px 0px black;
    display: flex;
    justify-content: center;
    gap: 2px;
    padding: 5px;
    box-sizing: border-box;
}
.ops{
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 2px;
    overflow: hidden;
    &>div{
        width: 40px;
        height: 40px;
        background-color: #ccc;
        border-radius: 5px;
        user-select: none;
        line-height: 40px;
        text-align: center;
        position: relative;
    }
}
.sunken{
    z-index: -1;
}
</style>