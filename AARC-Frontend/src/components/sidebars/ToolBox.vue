<script setup lang="ts">
import { ref } from 'vue';
import SideBar from '../common/SideBar.vue';
import { useEnvStore } from '@/models/stores/envStore';
import { storeToRefs } from 'pinia';
import { usePointLinkStore } from '@/models/stores/pointLinkStore';
import { ControlPointLinkType } from '@/models/save';

const envStore = useEnvStore()
const { creatingLinkType } = storeToRefs(usePointLinkStore())

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
        <div class="smallNote">用于添加标题/作者等信息，请勿用于标注站名</div>
        <div class="smallNote">需要线路/地形名称标签，请点击线路/地形创建</div>
        <div class="smallNoteVital">拖动到屏幕左上角即可删除</div>
        <button @click="envStore.createTextTag();fd()">创建文本标签</button>
    </div>
    <div class="toolItem">
        <select v-model="creatingLinkType">
            <option :value="ControlPointLinkType.fat">粗线</option>
            <option :value="ControlPointLinkType.thin">细线</option>
            <option :value="ControlPointLinkType.dot">虚线</option>
        </select>
        <button @click="envStore.startCreatingPtLink();fd()">创建车站间连线</button>
    </div>
    <div class="toolItem">
        <div class="smallNote">可用于创建带折角/分叉的车站间连线</div>
        <button @click="envStore.createPlainPt();fd()">创建控制点</button>
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