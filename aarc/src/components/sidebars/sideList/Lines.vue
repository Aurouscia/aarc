<script setup lang="ts">
import SideBar from '../../common/SideBar.vue';
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { useSideListShared } from './shared/useSideListShared';
import { Line, LineType } from '@/models/save';
import LineOptions from '../options/LineOptions.vue';
import LineDelPrompt from './shared/LineDelPrompt.vue';
import LineItemBtns from './shared/LineItemBtns.vue';
import Switch from '@/components/common/Switch.vue';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { disableContextMenu, enableContextMenu } from '@/utils/eventUtils/contextMenu';
import ColorPickerForLine from '../shared/ColorPickerForLine.vue';
import ColorPalette from '../ColorPalette.vue';
import boxIcon from '@/assets/ui/box.svg'
import SliceEditorTable from '../options/slices/SliceEditorTable.vue';


const props = defineProps<{isChildrenList?:boolean}>()
const { showPop } = useUniqueComponentsStore()
const sidebar = useTemplateRef('sidebar')
const lineOptions = useTemplateRef('lineOptions')
const childrenLines = useTemplateRef('childrenLines')
const sliceEditorTable = useTemplateRef('sliceEditorTable')
const linesContainer = useTemplateRef('linesContainer')

const { 
    lines,
    registerLinesArrange, disposeLinesArrange, mouseDownLineArrange,
    arrangingId, editingInfoLine, editInfoOfLine,
    createLine,
    wantDelLine, delLineStart, delLineAbort, delLineExe,
    showingLineGroup, lineGroupCheck, lineGroupsSelectable, autoInitShowingGroup,
    showingBtns, showingChildrenOfInfo,
    showChildrenOf, leaveParent,
    showListSidebar, hideListSidebar,
    saveStore, flashingLineId, scrollAndFlash
} = useSideListShared(LineType.common, sidebar, lineOptions, childrenLines, linesContainer, 'focusCommonLine')

const colorPalette = useTemplateRef('colorPalette')
const editingColorByPaletteLine = ref<Line>()
function editColorByPalette(line:Line){
    editingColorByPaletteLine.value = line
    window.setTimeout(()=>{
        colorPalette.value?.open()
    }, 1)
}

const editingSlicesLine = ref<Line>()
function editSlicesOfLine(line:Line){
    editingSlicesLine.value = line
    window.setTimeout(()=>{
        sliceEditorTable.value?.open()
    }, 1)
}

const pickers = useTemplateRef('pickers')
function clickContainer(){
    pickers.value?.forEach(cp => cp?.close())
}

async function focusLine(lineId?:number){
    if(lineId === undefined) return
    const line = saveStore.getLineById(lineId)
    if(!line) return
    if(props.isChildrenList){
        // 子列表：只负责滚动闪烁当前列表中的线路
        await scrollAndFlash(lineId)
        return
    }
    // 主列表逻辑
    // 先展开主列表，切换到该线路（或其父线路）所属的组
    showingLineGroup.value = line.group
    showListSidebar()
    // 在主列表中滚动到该线路（或父线路）的位置并闪烁
    const parentLineId = line.parent ?? line.id
    await scrollAndFlash(parentLineId)
    // 如果目标线路是子线路，等待主列表闪烁结束后，打开子列表并滚动闪烁
    if(line.parent){
        window.setTimeout(()=>{
            childrenLines?.value?.comeOut(line.parent)
            window.setTimeout(()=>{
                if(childrenLines?.value && 'focusLine' in childrenLines.value){
                    (childrenLines.value as any).focusLine(lineId)
                }
            }, 350)
        }, 800)
    }
}

defineExpose({
    comeOut: (lineId?:number)=>showListSidebar(lineId),
    fold: ()=>hideListSidebar(),
    focusLine
})
onMounted(()=>{
    //因为本组件在编辑器中始终存在，所以仅会执行一次
    showingBtns.value = 'children'
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
            <select v-if="!isChildrenList" v-model="showingLineGroup">
                <option :value="undefined">默认分组</option>
                <option v-for="g in lineGroupsSelectable" :value="g.id">
                    {{ g.name }}
                </option>
            </select>
            <div v-else class="childrenListTitle">
                <div class="parentLineName nowrapEllipsis" :style="{color:showingChildrenOfInfo.color}">
                    {{ showingChildrenOfInfo.name }}
                </div>
            </div>
            <!--注：shrink-way填v-if会导致二次打开后Switch状态异常-->
            <Switch :left-text="'设置'" :right-text="'调序'" :initial="'left'"
                @left="showingBtns='children'" @right="showingBtns='arrange'"></Switch>
        </div>
        <div ref="linesContainer" class="lines" :class="{arranging: arrangingId >= 0}">
            <div v-for="l,idx in lines" :key="l.id" :data-line-id="l.id" :class="{arranging: arrangingId==l.id, flash: flashingLineId===l.id}">
                <div v-if="!isChildrenList" class="colorEdit">
                    <div v-if="showingBtns==='arrange'" class="sqrBtn paletteEntry" :style="{backgroundColor: l.color}"
                        @click="editColorByPalette(l)">
                        <img :src="boxIcon"/>
                    </div>
                    <ColorPickerForLine v-else ref="pickers" :line="l" :z-index="idx"></ColorPickerForLine>
                </div>
                <div v-else class="sqrBtn" :style="{backgroundColor: l.color, cursor:'default'}"
                    @click="showPop('支线颜色跟随主线，不可单独调整', 'info')">
                </div>
                <LineItemBtns
                    :mouse-down-line-arrange="mouseDownLineArrange"
                    :del-line-start="delLineStart"
                    :edit-info-of-line="editInfoOfLine"
                    :edit-slices-of-line="editSlicesOfLine"
                    :show-children-of="showChildrenOf"
                    :is-in-children-list="isChildrenList"
                    :leave-parent="leaveParent"
                    :showing-btns="showingBtns"
                    :arranging-id="arrangingId"
                    :l="l"
                    :line-type-called="'线路'"
                    @close-sidebar="sidebar?.fold()"></LineItemBtns>
            </div>
            <div class="newLine" @click="createLine">
                {{ isChildrenList ? '+新支线' : '+新线路'}}
            </div>
        </div>
    </SideBar>
    <LineDelPrompt :line="wantDelLine" :line-called="'线路'" :pt-called="'车站'" :with-sta-default="false"
        @abort="delLineAbort" @exe="delLineExe"></LineDelPrompt>
    <LineOptions ref="lineOptions" v-if="editingInfoLine" :line="editingInfoLine"
        :line-type-called="'线路'" :line-width-range="{min:0.5, max:2, step:0.25}"
        @open-slice-editor="editSlicesOfLine(editingInfoLine)"></LineOptions>
    <ColorPalette ref="colorPalette" v-if="editingColorByPaletteLine"
        :editing-line="editingColorByPaletteLine"></ColorPalette>
    <SliceEditorTable ref="sliceEditorTable" v-if="editingSlicesLine"
        :line="editingSlicesLine" @close="sidebar?.fold()"></SliceEditorTable>
    <Lines v-if="!isChildrenList" ref="childrenLines" :is-children-list="true"></Lines>
</template>

<style scoped lang="scss">
.paletteEntry{
    display: flex;
    justify-content: center;
    align-items: center;
    img{
        width: 70%;
        height: 70%;
    }
}

.childrenListTitle{
    font-weight: bold;
    .parentLineName{
        font-size: 16px;
        max-width: 120px;
    }
}
</style>