<script setup lang="ts">
import { computed, ref } from 'vue';
import Lines from './sidebars/sideList/Lines.vue';
import Terrains from './sidebars/sideList/Terrains.vue';
import SizeEdit from './sidebars/SizeEdit.vue';
import ExportPng from './sidebars/ExportPng.vue';
import Configs from './sidebars/Configs.vue';
import { storeToRefs } from 'pinia';
import { usePreventLeavingUnsavedStore } from '@/utils/eventUtils/preventLeavingUnsaved';
import { useSnapStore } from '@/models/stores/snapStore';
import foldImg from '@/assets/ui/fold.svg';
import snapGridImg from '@/assets/ui/editor/snapGrid.svg';
import snapGridEnabledImg from '@/assets/ui/editor/snapGridEnabled.svg';
import snapInterPtImg from '@/assets/ui/editor/snapInterPt.svg';
import snapInterPtEnabledImg from '@/assets/ui/editor/snapInterPtEnabled.svg';
import snapNeighborExtendImg from '@/assets/ui/editor/snapNeighborExtend.svg';
import snapNeighborExtendEnabledImg from '@/assets/ui/editor/snapNeighborExtendEnabled.svg';
import ToolBox from './sidebars/ToolBox.vue';
import { useEnteredCanvasFromStore } from '@/app/globalStores/enteredCanvasFrom';

const lines = ref<InstanceType<typeof Lines>>()
const terrains = ref<InstanceType<typeof Terrains>>()
const toolBox = ref<InstanceType<typeof ToolBox>>()
const sizeEdit = ref<InstanceType<typeof Terrains>>()
const exportPng = ref<InstanceType<typeof ExportPng>>()
const configs = ref<InstanceType<typeof Configs>>()
const { preventingLeaving, unsavedForALongTime } = storeToRefs(usePreventLeavingUnsavedStore())
const { 
    snapNeighborExtendsEnabled:snee,
    snapInterPtEnabled:sipe,
    snapGridEnabled:sge 
} = storeToRefs(useSnapStore())
const anotherMenuFolded = ref(true)

type SidebarNames = 'lines'|'terrains'|'sizeEdit'|'exportPng'|'configs'|'toolBox'|undefined
const activeSidebarName = ref<SidebarNames>()

const saveBtnMode = computed<'save'|'leave'>(()=>{
    if(preventingLeaving.value)
        return 'save'
    return 'leave'
})
const saveBtnText = computed<'保存'|'离开'>(()=>{
    if(saveBtnMode.value == 'save')
        return '保存'
    return '离开'
})

function openSidebarOf(name:SidebarNames){
    activeSidebarName.value = name
    if(name==='lines')
        lines.value?.comeOut()
    else
        lines.value?.fold()
    if(name==='terrains')
        terrains.value?.comeOut()
    else
        terrains.value?.fold()
    if(name==='sizeEdit')
        sizeEdit.value?.comeOut()
    else
        sizeEdit.value?.fold()
    if(name==='exportPng')
        exportPng.value?.comeOut()
    else
        exportPng.value?.fold()
    if(name==='configs')
        configs.value?.comeOut()
    else
        configs.value?.fold()
    if(name==='toolBox')
        toolBox.value?.comeOut()
    else
        toolBox.value?.fold()
}

const { goBackToWhereWeEntered } = useEnteredCanvasFromStore()
function saveData(){
    if(saveBtnMode.value=='save')
        emit('saveData')
    else if(saveBtnMode.value=='leave'){
        goBackToWhereWeEntered()
    }
}
const emit = defineEmits<{
    (e:'saveData'):void
}>()
</script>

<template>
    <div class="menu">
        <div @click="openSidebarOf('lines')" class="sqrBtn withShadow">线路</div>
        <div @click="openSidebarOf('terrains')" class="sqrBtn withShadow">地形</div>
        <div @click="openSidebarOf('toolBox')" class="sqrBtn withShadow">工具</div>
        <div @click="openSidebarOf('sizeEdit')" class="sqrBtn withShadow">画布</div>
        <div @click="openSidebarOf('configs')" class="sqrBtn withShadow">设置</div>
        <div @click="openSidebarOf('exportPng')" class="sqrBtn withShadow">导出</div>
        <div @click="saveData" class="sqrBtn withShadow saveBtn">
            <div v-show="preventingLeaving" class="saveRedDot" :class="{unsavedForALongTime}"></div>
            {{ saveBtnText }}
        </div>
    </div>
    <Lines ref="lines"></Lines>
    <Terrains ref="terrains"></Terrains>
    <ToolBox ref="toolBox"></ToolBox>
    <SizeEdit ref="sizeEdit"></SizeEdit>
    <ExportPng ref="exportPng"></ExportPng>
    <Configs ref="configs"></Configs>
    <div class="anotherMenu" :class="{anotherMenuFolded}">
        <div class="foldBtn sqrBtn withShadow" @click="anotherMenuFolded=!anotherMenuFolded">
            <img :src="foldImg"/>
        </div>
        <div @click="snee=!snee" :class="{snapEnabled:snee}" class="sqrBtn withShadow">
            <img :src="snee ? snapNeighborExtendEnabledImg : snapNeighborExtendImg"/>
        </div>
        <div @click="sipe=!sipe" :class="{snapEnabled:sipe}" class="sqrBtn withShadow">
            <img :src="sipe ? snapInterPtEnabledImg : snapInterPtImg"/>
        </div>
        <div @click="sge=!sge" :class="{snapEnabled:sge}" class="sqrBtn withShadow">
            <img :src="sge ? snapGridEnabledImg : snapGridImg"/>
        </div>
    </div>
</template>

<style scoped lang="scss">
.anotherMenu{
    z-index: 1000;
    position: fixed;
    right: 5px;
    bottom: 5px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    .sqrBtn{
        width: 30px;
        height: 30px;
        line-height: 30px;
        font-size: 12px;
    }
    .snapEnabled{
        box-shadow: 0px 0px 8px 0px green;
    }
    .foldBtn{
        position: absolute;
        left: -38px;
        bottom: 0px;
        width: 30px;
        height: 30px;
        background-color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        img{
            width: 70%;
            height: 70%;
            transition: 0.2s;
            transform: rotate(270deg);
        }
    }
}
.anotherMenuFolded{
    right: -35px;
    .foldBtn{
        opacity: 0.4;
        img{
            transform: rotate(90deg);
        }
    }
}

.menu{
    z-index: 1002;
    position: fixed;
    bottom: 5px;
    left: 5px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    .sqrBtn{
        width: 36px;
        height: 36px;
        line-height: 36px;
        font-size: 14px;
    }
}
.saveBtn{
    color: white;
    background-color: olivedrab;
    position: relative;
    &:hover{
        background-color: green;
    }
    .saveRedDot{
        width: 12px;
        height: 12px;
        border-radius: 1000px;
        box-sizing: border-box;
        background-color: red;
        border: 2px solid white;
        position: absolute;
        right: -6px;
        top: -6px;
        &.unsavedForALongTime{
            width: 20px;
            height: 20px;
            right: -10px;
            top: -10px;
            animation: fadeOutIn 1s infinite;
        }
        @keyframes fadeOutIn {
            0% {
                opacity: 1;
            }
            45%{
                opacity: 1;
            }
            50% {
                opacity: 0.1;
            }
            95% {
                opacity: 0.1;
            }
            100% {
                opacity: 1;
            }
        }
    }
}
</style>