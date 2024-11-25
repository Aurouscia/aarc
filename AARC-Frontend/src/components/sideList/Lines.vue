<script setup lang="ts">
import { useSaveStore } from '@/models/stores/saveStore';
import SideBar from '../common/SideBar.vue';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, ref } from 'vue';
import { useLinesArrange } from '@/utils/eventUtils/linesArrange';
import { Line, LineType } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { useMainCvsDispatcher } from '@/models/cvs/dispatchers/mainCvsDispatcher';

const saveStore = useSaveStore()
const { save } = storeToRefs(saveStore)
const envStore = useEnvStore()
const mainCvsDispatcher = useMainCvsDispatcher()
const sidebar = ref<InstanceType<typeof SideBar>>()
const lines = ref<Line[]>([])

defineExpose({
    comeOut: ()=>{sidebar.value?.extend()}
})

const {
    registerLinesArrange, disposeLinesArrange, mouseDownLineArrange, activeId: arrangingId
} = useLinesArrange(65, lines, orderChanged) //65：一个线路框60高，加上5的缝隙
function orderChanged(){
    const orderedIds = lines.value.map(x=>x.id)
    saveStore.arrangeLinesOfType(orderedIds, LineType.common)
    mainCvsDispatcher.renderMainCvs()
}
function createLine(){
    envStore.createLine('line')
    init()
}
function delLine(line:Line){
    if(window.confirm(`确定删除线路"${line.name}"？`) && save.value){
        envStore.delLine(line.id)
        init()
    }
}
function init(){
    lines.value = saveStore.getLinesByType(LineType.common)
}
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
        <div v-if="save" class="lines" :class="{arranging: arrangingId >= 0}">
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