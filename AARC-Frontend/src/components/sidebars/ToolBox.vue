<script setup lang="ts">
import { ref } from 'vue';
import SideBar from '../common/SideBar.vue';
import { useEnvStore } from '@/models/stores/envStore';

const envStore = useEnvStore()

function fd(){
    sidebar.value?.fold()
}

const sidebar = ref<InstanceType<typeof SideBar>>()
defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})
</script>

<template>
<SideBar ref="sidebar">
    <div class="toolItem">
        <button @click="envStore.createTextTag();fd()">创建文本标签</button>
        <div class="smallNote">用于添加标题/作者等信息，请勿用于标注站名</div>
        <div class="smallNote">需要线路/地形名称标签，请点击线路/地形创建</div>
        <div class="smallNoteVital">拖动到屏幕左上角即可删除</div>
    </div>
    <div class="toolItem">
        <button class="off">创建出站换乘连线</button>
        <div class="smallNote">后续更新，敬请期待</div>
    </div>
    <div class="toolItem">
        <button class="off">创建区间类型标记</button>
        <div class="smallNote">后续更新，敬请期待</div>
    </div>
</SideBar>
</template>

<style scoped lang="scss">
.toolItem{
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-bottom: 1px solid #aaa;
    align-items: center;
    padding: 12px;
}
</style>