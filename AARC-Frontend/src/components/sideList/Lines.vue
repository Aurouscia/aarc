<script setup lang="ts">
import SideBar from '../common/SideBar.vue';
import { onMounted, onUnmounted } from 'vue';
import { useSideListShared } from './shared/sideListShared';
import { LineType } from '@/models/save';
import LineConfig from './shared/LineConfig.vue';

const { 
    sidebar, init, lines, envStore,
    registerLinesArrange, disposeLinesArrange, mouseDownLineArrange,
    arrangingId, editingInfoLineId, editInfoOfLine,
    createLine, delLine
} = useSideListShared(LineType.common, '线路')

defineExpose({
    comeOut: ()=>{sidebar.value?.extend()}
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
        @extend="registerLinesArrange" @fold="disposeLinesArrange" @click="editingInfoLineId=undefined">
        <div class="lines" :class="{arranging: arrangingId >= 0}">
            <div v-for="l in lines" :key="l.id" :class="{arranging: arrangingId==l.id}">
                <div class="colorEdit">
                    <label :for="'lineColor'+l.id" class="sqrBtn" :style="{backgroundColor:l.color}">　</label>
                    <input v-model="l.color" type="color" :id="'lineColor'+l.id" @blur="envStore.lineInfoChanged"/>
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

</style>