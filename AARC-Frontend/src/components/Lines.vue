<script setup lang="ts">
import { useSaveStore } from '@/models/stores/saveStore';
import SideBar from './common/SideBar.vue';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, ref } from 'vue';
import { useLinesArrange } from '@/utils/eventUtils/linesArrange';
import { Line } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';

const saveStore = useSaveStore()
const { save } = storeToRefs(saveStore)
const envStore = useEnvStore()
const sidebar = ref<InstanceType<typeof SideBar>>()

defineExpose({
    comeOut: ()=>{sidebar.value?.extend()}
})

const { registerLinesArrange, disposeLinesArrange, mouseDownLineArrange, activeId: arrangingId } 
    = useLinesArrange(65)
function createLine(){
    envStore.createLine()
}
function delLine(line:Line){
    if(window.confirm(`确定删除线路"${line.name}"？`) && save.value){
        envStore.delLine(line.id)
    }
}
onMounted(()=>{

})
onUnmounted(()=>{
    disposeLinesArrange()
})
</script>

<template>
    <SideBar ref="sidebar" :shrink-way="'v-show'" 
        @extend="registerLinesArrange" @fold="disposeLinesArrange">
        <div v-if="save" class="lines" :class="{arranging: arrangingId >= 0}">
            <div v-for="l in save.lines" :key="l.id" :class="{arranging: arrangingId==l.id}">
                <div class="sqrBtn">🖊</div>
                <input v-model="l.color" type="color" class="sqrBtn" @blur="envStore.lineColorChanged"/>
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
.lines{
    background-color: #ccc;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 5px;
    justify-content: flex-start;
    align-items: stretch;
    border-radius: 5px;
}
.lines.arranging{
    cursor: ns-resize;
}
.lines>div{
    height: 60px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    gap: 3px;
    background-color: white;
    padding: 5px;
    border-radius: 5px;
}
.lines>div.arranging{
    box-shadow: 0px 0px 5px 2px black;
    background-color: #ddd;
}
.newLine{
    font-size: 20px;
    cursor: pointer;
    color: #999;
    &:hover{
        color: black
    }
}
input[type=color]{
    width: 2rem;
    height: 2rem;
    border-width: 0px;
    border-radius: 5px;
    flex-shrink: 0;
}
.names{
    display: flex;
    flex-direction: column;
    gap: 3px;
    input{
        font-size: 14px;
        width: 100px;
        border: none;
    }
    input:first-child{
        font-size: 18px;
    }
}
.moveBtn{
    cursor: ns-resize;
}
</style>