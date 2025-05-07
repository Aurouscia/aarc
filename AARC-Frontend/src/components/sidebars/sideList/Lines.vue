<script setup lang="ts">
import SideBar from '../../common/SideBar.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { useSideListShared } from './shared/useSideListShared';
import { LineType } from '@/models/save';
import LineOptions from '../options/LineOptions.vue';
import { AuColorPicker } from '@aurouscia/au-color-picker';
import LineDelPrompt from './shared/LineDelPrompt.vue';
import LineItemBtns from './shared/LineItemBtns.vue';

const { 
    sidebar, lineOptions, lines, envStore,
    registerLinesArrange, disposeLinesArrange, mouseDownLineArrange,
    arrangingId, editingInfoLine, editInfoOfLine,
    createLine,
    wantDelLine, delLineStart, delLineAbort, delLineExe,
    showingLineGroup, lineGroupCheck, lineGroupsSelectable
} = useSideListShared(LineType.common, '线路')

const colorPicker = ref<InstanceType<typeof AuColorPicker>[]>([])
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
            <div v-for="l,idx in lines" :key="l.id" :class="{arranging: arrangingId==l.id}">
                <div class="colorEdit">
                    <AuColorPicker :initial="l.color"
                        @done="c=>{l.color=c;envStore.lineInfoChanged(l)}"
                        ref="colorPicker" :panel-base-z-index="idx"
                        :show-package-name="true"
                        :entry-respond-delay="1"
                        :panel-click-stop-propagation="true"></AuColorPicker>
                </div>
                <LineItemBtns :mouse-down-line-arrange="mouseDownLineArrange" :del-line-start="delLineStart"
                    :edit-info-of-line="editInfoOfLine" :arranging-id="arrangingId" :l="l" :line-type-called="'线路'"></LineItemBtns>
            </div>
            <div class="newLine" @click="createLine">
                +新线路
            </div>
        </div>
    </SideBar>
    <LineDelPrompt :line="wantDelLine" :line-called="'线路'" :pt-called="'车站'" :with-sta-default="false"
        @abort="delLineAbort" @exe="delLineExe"></LineDelPrompt>
    <LineOptions ref="lineOptions" v-if="editingInfoLine" :line="editingInfoLine" :line-width-range="{min:0.5, max:2, step:0.25}"></LineOptions>
</template>

<style scoped lang="scss">
@use './shared/arrangableList.scss';
</style>