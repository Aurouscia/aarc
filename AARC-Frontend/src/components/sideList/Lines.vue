<script setup lang="ts">
import SideBar from '../common/SideBar.vue';
import { onMounted, onUnmounted } from 'vue';
import { useSideListShared } from './shared/sideListShared';
import { LineType } from '@/models/save';

const { 
    sidebar, init, lines, envStore,
    registerLinesArrange, disposeLinesArrange, mouseDownLineArrange, arrangingId,
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
        @extend="registerLinesArrange" @fold="disposeLinesArrange">
        <div class="lines" :class="{arranging: arrangingId >= 0}">
            <div v-for="l in lines" :key="l.id" :class="{arranging: arrangingId==l.id}">
                <div class="colorEdit">
                    <label :for="'lineColor'+l.id" class="sqrBtn" :style="{backgroundColor:l.color}">　</label>
                    <input v-model="l.color" type="color" :id="'lineColor'+l.id" @blur="envStore.lineColorChanged"/>
                </div>
                <div class="names">
                    <input v-model="l.name"/>
                    <input v-model="l.nameSub"/>
                </div>
                <div class="sqrBtn moveBtn" @mousedown="e => mouseDownLineArrange(e, l.id)" @touchstart="e => mouseDownLineArrange(e, l.id)">
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