<script setup lang="ts">
import SideBar from '../../common/SideBar.vue';
import { onMounted, onUnmounted, ref } from 'vue';
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

defineProps<{isChildrenList?:boolean}>()
const { showPop } = useUniqueComponentsStore()

const { 
    sidebar, lineOptions, lines,
    registerLinesArrange, disposeLinesArrange, mouseDownLineArrange,
    arrangingId, editingInfoLine, editInfoOfLine,
    createLine,
    wantDelLine, delLineStart, delLineAbort, delLineExe,
    showingLineGroup, lineGroupCheck, lineGroupsSelectable, autoInitShowingGroup,
    showingBtns, showingChildrenOfInfo,
    showChildrenOf, leaveParent, childrenLines,
    showListSidebar, hideListSidebar
} = useSideListShared(LineType.common)

const colorPalette = ref<InstanceType<typeof ColorPalette>>()
const editingColorByPaletteLine = ref<Line>()
function editColorByPalette(line:Line){
    editingColorByPaletteLine.value = line
    window.setTimeout(()=>{
        colorPalette.value?.open()
    }, 1)
}

const pickers = ref<InstanceType<typeof ColorPickerForLine>[]>([])
function clickContainer(){
    pickers.value.forEach(cp=>cp.close())
}

defineExpose({
    comeOut: (lineId?:number)=>showListSidebar(lineId),
    fold: ()=>hideListSidebar()
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
        <div class="lines" :class="{arranging: arrangingId >= 0}">
            <div v-for="l,idx in lines" :key="l.id" :class="{arranging: arrangingId==l.id}">
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
                <LineItemBtns :mouse-down-line-arrange="mouseDownLineArrange" :del-line-start="delLineStart"
                    :edit-info-of-line="editInfoOfLine" :show-children-of="showChildrenOf"
                    :is-in-children-list="isChildrenList" :leave-parent="leaveParent"
                    :showing-btns="showingBtns" :arranging-id="arrangingId" :l="l" :line-type-called="'线路'"></LineItemBtns>
            </div>
            <div class="newLine" @click="createLine">
                {{ isChildrenList ? '+新支线' : '+新线路'}}
            </div>
        </div>
    </SideBar>
    <LineDelPrompt :line="wantDelLine" :line-called="'线路'" :pt-called="'车站'" :with-sta-default="false"
        @abort="delLineAbort" @exe="delLineExe"></LineDelPrompt>
    <LineOptions ref="lineOptions" v-if="editingInfoLine" :line="editingInfoLine"
        :line-type-called="'线路'" :line-width-range="{min:0.5, max:2, step:0.25}"></LineOptions>
    <ColorPalette ref="colorPalette" v-if="editingColorByPaletteLine"
        :editing-line="editingColorByPaletteLine"></ColorPalette>
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