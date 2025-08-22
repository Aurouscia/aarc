<script setup lang="ts">
import SideBar from '../../common/SideBar.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { LineType } from '@/models/save';
import { useSideListShared } from './shared/useSideListShared';
import LineOptions from '../options/LineOptions.vue';
import LineDelPrompt from './shared/LineDelPrompt.vue';
import LineItemBtns from './shared/LineItemBtns.vue';
import { disableContextMenu, enableContextMenu } from '@/utils/eventUtils/contextMenu';
import ColorPickerForTerrain from '../shared/ColorPickerForTerrain.vue';

const { 
    sidebar, lineOptions, lines: terrains,
    registerLinesArrange, disposeLinesArrange, mouseDownLineArrange, arrangingId,
    createLine, editingInfoLine, editInfoOfLine,
    wantDelLine, delLineStart, delLineAbort, delLineExe,
    showingLineGroup, lineGroupCheck, lineGroupsSelectable, autoInitShowingGroup,
    showListSidebar, hideListSidebar
} = useSideListShared(LineType.terrain)

const pickers = ref<InstanceType<typeof ColorPickerForTerrain>[]>([])
function clickContainer(){
    pickers.value.forEach(cp=>cp.close())
}

defineExpose({
    comeOut: showListSidebar,
    fold: hideListSidebar
})
onMounted(()=>{
    //因为本组件在编辑器中始终存在，所以仅会执行一次
    autoInitShowingGroup()
})
onUnmounted(()=>{
    disposeLinesArrange()
})
</script>

<template>
    <SideBar ref="sidebar" :shrink-way="'v-show'" class="arrangeableList" :body-no-position="true"
    @extend="registerLinesArrange();lineGroupCheck();enableContextMenu()"
    @fold="disposeLinesArrange();disableContextMenu()" @click="clickContainer">
        <div class="filter">
            <select v-model="showingLineGroup">
                <option :value="undefined">默认分组</option>
                <option v-for="g in lineGroupsSelectable" :value="g.id">
                    {{ g.name }}
                </option>
            </select>
        </div>
        <div class="lines" :class="{arranging: arrangingId >= 0}">
            <div v-for="l,idx in terrains" :key="l.id" :class="{arranging: arrangingId==l.id}">
                <ColorPickerForTerrain ref="pickers" :line="l" :z-index="idx"></ColorPickerForTerrain>
                <LineItemBtns :showing-btns="'arrange'"
                    :mouse-down-line-arrange="mouseDownLineArrange" :del-line-start="delLineStart"
                    :edit-info-of-line="editInfoOfLine" :show-children-of="()=>{}" :leave-parent="()=>{}"
                    :arranging-id="arrangingId" :l="l" :line-type-called="'地形'"></LineItemBtns>
            </div>
            <div class="newLine" @click="createLine">
                +新地形
            </div>
        </div>
    </SideBar>
    <LineDelPrompt :line="wantDelLine" :line-called="'地形'" :pt-called="'节点'" :with-sta-default="true"
        @abort="delLineAbort" @exe="delLineExe"></LineDelPrompt>
    <LineOptions ref="lineOptions" v-if="editingInfoLine" :line="editingInfoLine"
        :line-type-called="'地形'" :line-width-range="{min:0.5, max:12, step:0.5}"></LineOptions>
</template>

<style scoped lang="scss">
@use './shared/arrangableList.scss';

.lines>div{
    position: relative;
    .colorPanel{
        position: absolute;
        z-index: 10;
        top: 55px;
        left: 10px;
        padding: 5px;
        border-radius: inherit;
        background-color: inherit;
        display: flex;
        gap: 5px;
        flex-direction: column;
        .preset{
            width: 25px;
            height: 25px;
            border-radius: 1000px;
        }
        .colorInputConatainer{
            label{
                width: 25px;
                height: 25px;
                border-radius: 5px;
            }
        }
    }
    .colorPanel>div{
        display: flex;
        gap: 3px
    }
    .colorPanel>div:first-child{
        border-bottom: 1px solid #ccc;
        padding-bottom: 4px;
        margin-bottom: -2px;
    }
}
</style>