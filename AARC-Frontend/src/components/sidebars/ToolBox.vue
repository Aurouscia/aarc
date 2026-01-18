<script setup lang="ts">
import { useTemplateRef } from 'vue';
import SideBar from '../common/SideBar.vue';
import { useEnvStore } from '@/models/stores/envStore';
import { storeToRefs } from 'pinia';
import { usePointLinkStore } from '@/models/stores/pointLinkStore';
import { ControlPointLinkType } from '@/models/save';
import { useStashStore } from '@/models/stores/utils/stashStore';

const envStore = useEnvStore()
const pointLinkStore = usePointLinkStore()
const { creatingLinkType } = storeToRefs(pointLinkStore)
const stashStore = useStashStore()

function fd(){
    sidebar.value?.fold()
}

const sidebar = useTemplateRef('sidebar')
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
        <button @click="envStore.createTextTag();fd()">创建文本标签</button>
    </div>
    <div class="toolItem">
        <div v-if="creatingLinkType===ControlPointLinkType.cluster" class="smallNote">
            选择“车站团”模式时，连线中央会有标记用细线，其仅在编辑器可见，导出时会隐藏
        </div>
        <select v-model="creatingLinkType">
            <option :value="ControlPointLinkType.fat">粗线</option>
            <option :value="ControlPointLinkType.thin">细线</option>
            <option :value="ControlPointLinkType.dot">虚线(原色)</option>
            <option :value="ControlPointLinkType.dotCover">虚线(覆盖)</option>
            <option :value="ControlPointLinkType.cluster">车站团</option>
        </select>
        <button @click="pointLinkStore.startCreatingPtLink();fd()">创建车站间连线</button>
    </div>
    <div class="toolItem">
        <div class="smallNote">可用于创建带折角/分叉的车站间连线</div>
        <button @click="envStore.createPlainPt();fd()">创建控制点</button>
    </div>
    <div class="toolItem">
        <div class="smallNote">
            当“不确定会不会改坏”时，可以暂存当前画布的样子，如果修改后后悔了，可一键还原<br/>
            请注意：刷新/退出后，暂存就会丢失！
        </div>
        <div class="smallNoteVital">未经检验的新功能，请谨慎使用</div>
        <button :class="{minor: stashStore.thawable}" @click="stashStore.freeze()">暂存当前画布状态</button>
        <button v-if="stashStore.thawable" @click="stashStore.thaw()">还原为暂存的状态</button>
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