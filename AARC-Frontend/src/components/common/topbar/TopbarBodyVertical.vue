<script setup lang="ts">
import { useRouter } from 'vue-router';
import { TopbarModel, TopbarModelItem } from './model/topbarModel';
import { ref } from 'vue';
import foldImg from '@/assets/ui/fold.svg';
import { SwipeListener } from '@/utils/eventUtils/swipe'

const router = useRouter();
const props = defineProps<{
    data: TopbarModel
}>();
function clickHandler(item: TopbarModelItem){
    if(item.SubItems){
        item.IsActive = !item.IsActive;
        return;
    }
    if(item.Link){
        router.push(item.Link);
        folded.value = true;
    }
}

const folded = ref<boolean>(true);
function toggleFold(force:"fold"|"extend"|"toggle"= "toggle"){
    if(force=="toggle"){
        folded.value = !folded.value;
    }
    else if(force=="fold"){
        folded.value = true;
    }
    else if(force=="extend"){
        folded.value = false;
    }
    if(!folded.value){
        props.data.Items.forEach(i=>{
            i.IsActive = false;
        });
        swl = new SwipeListener((n)=>{
            if(n=="right"){
                toggleFold('fold');
            }
        },"hor",100)
        swl.startListen()
    }
    else{
        swl?.stopListen()
        swl = undefined;
    }
}
defineExpose({
    toggleFold
});

let swl: SwipeListener|undefined
</script>

<template>
<div class="topbarBodyVertical" :class="{folded}">
    <div v-for="i in data.Items" class="topbarItem">
        <div class="topbarText" @click="clickHandler(i)">
            <span>{{ i.Title }}</span>
            <img v-show="i.SubItems" :src="foldImg" :class="{activeSubFoldImg:i.IsActive}"/>
        </div>
        <div v-if="i.SubItems && i.IsActive" class="topbarSubItemList">
            <div v-for="si in i.SubItems" @click="router.push(si.Link);toggleFold('fold')">
                {{ si.Title }}
            </div>
        </div>
    </div>
</div>
<div class="cover" :class="{folded}" @click="toggleFold('fold')">

</div>
</template>

<style scoped lang="scss">
@use '@/styles/globalValues';

$topbar-body-vert-width: 180px;
.notifExists{
    position: absolute;
    top: 9px;
    left: 46px;
}
.topbarBodyVertical{
    position: fixed;
    top: 0px;
    right: 0px;
    height: 100vh;
    width: $topbar-body-vert-width;
    transition: 0.3s;
    box-shadow: 0px 0px 12px 0px black;
    background-color: white;
    z-index: 960;
    padding-top: globalValues.$topbar-height;
    display: flex;
    flex-direction: column;
    user-select: none;
}
.topbarBodyVertical.folded{
    right: - $topbar-body-vert-width;
    box-shadow: 0px 0px 0px 0px black;
}
.topbarText{
    display: flex;
    justify-content: space-between;
    align-items: center;
    img{
        width: 14px;
        height: 14px;
        transform: rotate(90deg);
        object-fit: contain;
        transition: 0.2s;
    }
    img.activeSubFoldImg{
        transform: rotate(0deg);
    }
}
.topbarItem{
    position: relative;
    padding: 10px;
    font-size: 20px;
    border-top: 1px solid #ddd;
    color: #333;
    cursor: pointer;
}
.topbarSubItemList{
    font-size: 16px;
    margin:10px 0px 0px 8px;
    div{
        border-top: 1px solid #ddd;
        padding: 8px;
        color: #666;
        &:hover{
            background-color: #ccc;
            color: black;
        }
    }
}
.cover{
    position: fixed;
    left: 0px;
    right: 0px;
    top: 0px;
    bottom: 0px;
    transition: 0.3s;
    background-color: black;
    opacity: 0;
    z-index: 800;
}
.cover.folded{
    left: 100vw;
}
</style>