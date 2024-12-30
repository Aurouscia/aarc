<script setup lang="ts">
import SideBar from '../common/SideBar.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { useSideListShared } from './shared/useSideListShared';
import { LineType } from '@/models/save';
import LineConfig from './shared/LineConfig.vue';
import { AuColorPicker } from '@aurouscia/au-color-picker';

const { 
    sidebar, init, lines, envStore,
    registerLinesArrange, disposeLinesArrange, mouseDownLineArrange,
    arrangingId, editingInfoLineId, editInfoOfLine,
    createLine, delLine
} = useSideListShared(LineType.common, '线路')

const colorPicker = ref<InstanceType<typeof AuColorPicker>[]>([])
function clickContainer(){
    editingInfoLineId.value = undefined
    colorPicker.value.forEach(cp=>cp.closePanel())
}

defineExpose({
    comeOut: ()=>{sidebar.value?.extend()},
    fold: ()=>{sidebar.value?.fold()}
})
onMounted(()=>{
    init()
})
onUnmounted(()=>{
    disposeLinesArrange()
})
</script>

<template>
    <SideBar ref="sidebar" :shrink-way="'v-show'" class="arrangeableList"
        @extend="registerLinesArrange" @fold="disposeLinesArrange" @click="clickContainer">
        <div class="lines" :class="{arranging: arrangingId >= 0}">
            <div v-for="l,idx in lines" :key="l.id" :class="{arranging: arrangingId==l.id}">
                <div class="colorEdit">
                    <AuColorPicker :initial="l.color"
                        @done="c=>{l.color=c;envStore.lineInfoChanged()}"
                        ref="colorPicker" :panel-base-z-index="idx"
                        :show-package-name="true"
                        :entry-respond-delay="1"
                        :panel-click-stop-propagation="true"></AuColorPicker>
                </div>
                <div class="names">
                    <input v-model="l.name"/>
                    <input v-model="l.nameSub"/>
                </div>
                <div class="infoEdit">
                    <div class="sqrBtn" :class="{sqrActive:editingInfoLineId===l.id}" @click="editInfoOfLine(l.id)">...</div>
                    <div v-if="editingInfoLineId===l.id" class="infoEditPanel">
                        <LineConfig :line="l"></LineConfig>
                    </div>
                </div>
                <div class="sqrBtn moveBtn" :class="{sqrActive:arrangingId===l.id}"
                    @mousedown="e => mouseDownLineArrange(e, l.id)"
                    @touchstart="e => mouseDownLineArrange(e, l.id)">
                    ⇅
                </div>
                <div class="sqrBtn" @click="delLine(l)">
                    ×
                </div>
            </div>
            <div class="newLine" @click="createLine">
                +新线路
            </div>
        </div>
    </SideBar>
</template>

<style scoped lang="scss">
input{margin: 0px;padding: 0px;}
</style>