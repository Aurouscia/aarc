<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import SideBar from '../common/SideBar.vue';
import { useEnvStore } from '@/models/stores/envStore';
import { storeToRefs } from 'pinia';
import { usePointLinkStore } from '@/models/stores/pointLinkStore';
import { useSelectionStore } from '@/models/stores/selectionStore';
import { ControlPointLinkType } from '@/models/save';
import Prompt from '../common/Prompt.vue';

const envStore = useEnvStore()
const pointLinkStore = usePointLinkStore()
const selectionStore = useSelectionStore()
const { creatingLinkType } = storeToRefs(pointLinkStore)

function fd(){
    sidebar.value?.fold()
}
function end(){
    envStore.endEveryEditing()
}

const showPcSelectionGuide = ref(false)
const openSelectionLocked = ref(false)
function openSelection(type:'mouse'|'touch'){
    if(openSelectionLocked.value) return // 避免一些触屏设备两者都触发
    openSelectionLocked.value = true
    window.setTimeout(()=>{
        openSelectionLocked.value = false
    }, 100)

    end()
    if(type == 'mouse'){
        showPcSelectionGuide.value = true
    }
    else{
        selectionStore.enableForTouchScreen()
        fd()
    }
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
        <button @click="end();envStore.createTextTag();fd()">创建文本标签</button>
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
        <button @click="end();pointLinkStore.startCreatingPtLink();fd()">创建车站间连线</button>
    </div>
    <div class="toolItem">
        <div class="smallNote">可用于创建带折角/分叉的车站间连线</div>
        <button @click="end();envStore.createPlainPt();fd()">创建控制点</button>
    </div>
    <div class="toolItem">
        <div class="smallNote">目前仅支持批量选中后移动</div>
        <button @mouseup="openSelection('mouse')" @touchstart="openSelection('touch')">
            批量选中元素
        </button>
        <Prompt v-if="showPcSelectionGuide" :close-btn="true" @close="showPcSelectionGuide=false">
            PC用户您好：<br/>
            按住<code>shift</code>并拖动鼠标左键以添加选中<br/>
            按住<code>shift</code>+<code>ctrl</code>并拖动鼠标左键以减少选中
        </Prompt>
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