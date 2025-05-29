<script setup lang="ts">
import SideBar from '../../common/SideBar.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { Line, LineType } from '@/models/save';
import { useSideListShared } from './shared/useSideListShared';
import LineOptions from '../options/LineOptions.vue';
import { AuColorPickerPresetsNested } from '@aurouscia/au-color-picker';
import { useColorPresetNames } from './shared/useColorPresetNames';
import LineDelPrompt from './shared/LineDelPrompt.vue';
import LineItemBtns from './shared/LineItemBtns.vue';

const { 
    sidebar, lineOptions, lines: terrains, envStore,
    registerLinesArrange, disposeLinesArrange, mouseDownLineArrange, arrangingId,
    createLine, editingInfoLine, editInfoOfLine,
    wantDelLine, delLineStart, delLineAbort, delLineExe,
    showingLineGroup, lineGroupCheck, lineGroupsSelectable
} = useSideListShared(LineType.terrain)

const { getPresetNameByEnum, getPresetEnumByName, presets } = useColorPresetNames()

function colorPreChanged(l:Line, presetName:string|undefined){
    l.colorPre = getPresetEnumByName(presetName)
    window.setTimeout(()=>{
        envStore.lineInfoChanged(l)
    },1)
}
function colorPickerDone(l:Line, c:string){
    l.color = c
    if(!l.colorPre)
        envStore.lineInfoChanged(l)
}

const colorPicker = ref<InstanceType<typeof AuColorPickerPresetsNested>[]>([])
function clickContainer(){
    colorPicker.value.forEach(cp=>cp.closePanel())
}

defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})
onMounted(()=>{
    
})
onUnmounted(()=>{
    disposeLinesArrange()
})
</script>

<template>
    <SideBar ref="sidebar" :shrink-way="'v-show'" class="arrangeableList" :body-no-position="true"
    @extend="registerLinesArrange();lineGroupCheck()" @fold="disposeLinesArrange" @click="clickContainer">
        <div class="filter">
            <select v-model="showingLineGroup">
                <option :value="undefined">默认分组</option>
                <option v-for="g in lineGroupsSelectable" :value="g.id">
                    {{ g.name }}
                </option>
            </select>
        </div>
        <div class="lines" :class="{arranging: arrangingId >= 0}">
            <div v-for="l in terrains" :key="l.id" :class="{arranging: arrangingId==l.id}">
                <AuColorPickerPresetsNested
                    :initial="l.color"
                    :presets="presets"
                    :initial-selected-preset="getPresetNameByEnum(l.colorPre)"
                    @preset-switched="n=>colorPreChanged(l, n)"
                    @done="c=>colorPickerDone(l,c)"
                    :show-package-name="true"
                    :entry-respond-delay="1"
                    ref="colorPicker"
                    :panel-click-stop-propagation="true"
                    ></AuColorPickerPresetsNested>
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
    <LineOptions ref="lineOptions" v-if="editingInfoLine" :line="editingInfoLine" :line-width-range="{min:0.5, max:12, step:0.5}"></LineOptions>
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