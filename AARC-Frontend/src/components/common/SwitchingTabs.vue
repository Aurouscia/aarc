<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';

const props = defineProps<{texts:string[]}>();
const selectedTab = ref<number>(0);
function switchTo(idx:number){
    selectedTab.value = idx;
    var counter = 0;
    for(var e of tabs){
        if(counter==idx){
            if(e.tagName.toLowerCase()=='table'){
                (e as HTMLElement).style.display='table'
            }else{
                (e as HTMLElement).style.display='block'
            }
        }else{
            (e as HTMLElement).style.display='none'
        }
        counter++;
    }
    emit('switch',idx);
}
const emit = defineEmits<{
    (e:'switch',idx:number):void
}>();
var tabs:HTMLCollection;
const tabsContainer = ref<HTMLDivElement>();
onMounted(async ()=>{
    //可能子代组件没挂载好导致获取不到，必须等到下一个tick再执行
    await nextTick();
    if(tabsContainer.value){
        tabs = tabsContainer.value?.children;
    }
    switchTo(0);
})
</script>

<template>
    <div class="switchingTabs">
        <div class="controls">
            <div v-for="t,idx in props.texts" @click="switchTo(idx)" :class="{selected:idx==selectedTab}">
                {{ t }}
            </div>
        </div>
        <div class="tabsContainer" ref="tabsContainer">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>
.tabsContainer{
    position: relative;
}
.switchingTabs{
    display: flex;
    flex-direction: column;
    background-color: #fff;
    gap:5px
}
.controls>div:hover{
    background-color: #eee;
    border-bottom: 4px solid #aaa;
}
.controls>div.selected{
    color: cornflowerblue;
    border-bottom: 4px solid cornflowerblue;
    font-weight: bold;
}
.controls>div{
    flex-grow: 1;
    padding: 10px 4px 10px 3px;
    color:#333;
    border-bottom: 4px solid #ccc;
    text-align: center;
    cursor: pointer;
    flex-basis: 10px;
    border-radius: 5px 5px 0px 0px;
    transition: 0.2s;
}
.controls{
    display: flex;
    flex-direction: row;
    justify-content:space-around;
    align-items: center;
    user-select: none;
    background-color: #f6f6f6;
}
</style>