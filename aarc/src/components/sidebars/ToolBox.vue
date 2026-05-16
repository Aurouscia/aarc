<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import SideBar from '../common/SideBar.vue';
import { useEnvStore } from '@/models/stores/envStore';
import { storeToRefs } from 'pinia';
import { usePointLinkStore } from '@/models/stores/pointLinkStore';
import { useSelectionStore } from '@/models/stores/selectionStore';
import { ControlPointLinkType } from '@/models/save';
import { useStashStore } from '@/models/stores/utils/stashStore';
import Prompt from '../common/Prompt.vue';
import { searchMarkForEmptyName, useNameSearchStore } from '@/models/stores/nameSearchStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useEditorLocalConfigStore } from '@/app/localConfig/editorLocalConfig';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';
import StringReplace from './StringReplace.vue';
import ConfigSection from './configs/shared/ConfigSection.vue';

const envStore = useEnvStore()
const pointLinkStore = usePointLinkStore()
const selectionStore = useSelectionStore()
const { creatingLinkType } = storeToRefs(pointLinkStore)
const stashStore = useStashStore()
const nameSearchStore = useNameSearchStore()
const { showPop } = useUniqueComponentsStore()
const { duplicateNameDistThrs } = storeToRefs(useEditorLocalConfigStore())
const { visitorMode } = storeToRefs(useMainCvsDispatcher())
const mustBackup = defineModel<boolean>()

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

function findDuplicateStas(){
    const name = nameSearchStore.findDuplicateAndFarEnough()
    if(!name){
        showPop(`指定间距(${duplicateNameDistThrs.value})外\n没有重名车站`, 'success')
        return
    }
    nameSearchStore.toggleShow(name)
    fd()
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
        <div class="smallNote">用于添加标题/作者等，<b style="color:red">勿</b>用于标注站名</div>
        <div class="smallNote">需要线路名标签，请点击线路/地形创建</div>
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
    <div class="toolItem">
        <div class="smallNote">
            当“不确定会不会改坏”时，可以暂存当前画布的样子，如果修改后后悔了，可一键还原<br/>
            请注意：刷新/退出后，暂存就会丢失！
        </div>
        <button :class="{minor: stashStore.thawable}" @click="stashStore.freeze()">暂存当前画布状态</button>
        <button v-if="stashStore.thawable" @click="stashStore.thaw()">还原为暂存的状态</button>
    </div>
    <div class="toolItem" v-if="!visitorMode">
        <div class="smallNote">
            使本次保存强制生成备份<br/>
            建议在公共存档“即将交给他人”前备份一次<br/>
            <b>缺陷：</b>仅对“绿色保存按钮”有效，ctrl+S无效
        </div>
        <div style="display: flex;align-items: center;color:#999">
            <input v-model="mustBackup" type="checkbox"/>请勾选
        </div>
    </div>
    <ConfigSection title="站名相关功能">
        <button @click="nameSearchStore.toggleShow(searchMarkForEmptyName);fd()">
            查找无名车站
        </button>
        <button @click="findDuplicateStas">
            检测名称重复车站
        </button>
    </ConfigSection>
    <StringReplace></StringReplace>
    <div style="height: 100px;"></div>
</SideBar>
</template>

<style scoped lang="scss">
.toolItem{
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-bottom: 1px solid #ddd;
    align-items: center;
    padding: 12px;
    &:last-of-type{
        border-bottom: 0px;
    }
}
.configSection {
    padding: 0px;
    &:deep(h2) {
        align-self: stretch;
        border: none;
    }
}
</style>