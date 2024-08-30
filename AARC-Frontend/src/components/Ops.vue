<script setup lang="ts">
import { computed, CSSProperties, ref } from 'vue';

export interface OpsPosProps{
    show?:boolean
    x:number, y:number,
    at: 'lt'|'lb'|'rt'|'rb'
}
const props = defineProps<{
    pos?: OpsPosProps
}>()
const height = 200
const width = 50
const dist = 10
const sunken = ref<boolean>(true);
let sinkTimer = 0
const opsStyle = computed<CSSProperties>(()=>{
    window.clearTimeout(sinkTimer)
    sunken.value = false
    if(!props.pos)
        return { }
    let opacity = 1;
    if(!props.pos.show){
        opacity = 0;
        sinkTimer = window.setTimeout(()=>{
            sunken.value = true
        }, 200)
    }
    let top:number, left:number;
    if(props.pos.at == 'lb' || props.pos.at == 'lt'){
        left = props.pos.x - width - dist
    }else{
        left = props.pos.x + dist
    }
    if(props.pos.at == 'lt' || props.pos.at == 'rt'){
        top = props.pos.y - height - dist
    }else{
        top = props.pos.y + dist
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
    <div>1</div>
    <div>2</div>
    <div>3</div>
    <div>4</div>
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
    }
}
.sunken{
    z-index: -1;
}
</style>