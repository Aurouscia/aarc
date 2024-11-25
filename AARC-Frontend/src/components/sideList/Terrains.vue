<script setup lang="ts">
import SideBar from '../common/SideBar.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { LineType } from '@/models/save';
import { useConfigStore } from '@/models/stores/configStore';
import { useSideListShared } from './shared/sideListShared';

const { 
    sidebar, init, lines: terrains, envStore,
    registerLinesArrange, disposeLinesArrange, mouseDownLineArrange, arrangingId,
    createLine, delLine
} = useSideListShared(LineType.terrain, '地形')

const cs = useConfigStore()

const editingColorLineId = ref<number>()
function toggleEditingColorLineId(lineId?:number){
    if(lineId && lineId == editingColorLineId.value)
        editingColorLineId.value = undefined
    else
        editingColorLineId.value = lineId
}

defineExpose({
    comeOut: ()=>{sidebar.value?.extend()}
})
onMounted(()=>{
    init()
    sidebar.value?.extend()
})
onUnmounted(()=>{
    disposeLinesArrange()
})
</script>

<template>
    <SideBar ref="sidebar" :shrink-way="'v-show'" class="arrangeableList"
        @extend="registerLinesArrange" @fold="disposeLinesArrange">
        <div class="lines" :class="{arranging: arrangingId >= 0}">
            <div v-for="l in terrains" :key="l.id" :class="{arranging: arrangingId==l.id}" @click="toggleEditingColorLineId()">
                <div class="sqrBtn" :style="{backgroundColor: l.color}"
                    @click="e=>{toggleEditingColorLineId(l.id);e.stopPropagation()}"></div>
                <div v-if="editingColorLineId===l.id" class="colorPanel" @click="e=>e.stopPropagation()">
                    <div>
                        <input v-model="l.color" type="color" @blur="envStore.lineColorChanged"/>
                        <input name="colorType" type="radio" id="colorCustom"/>
                        <label for="colorCustom">自定义</label>
                    </div>
                    <div>
                        <div class="preset" :style="{backgroundColor: cs.config.colorPresetWater}"></div>
                        <input name="colorType" type="radio" id="colorWater"/>
                        <label for="colorWater">水系</label>
                    </div>
                    <div>
                        <div class="preset" :style="{backgroundColor: cs.config.colorPresetGreenland}"></div>
                        <input name="colorType" type="radio" id="colorGreenland"/>
                        <label for="colorGreenland">绿地</label>
                    </div>
                    <div>
                        <div class="preset" :style="{backgroundColor: cs.config.colorPresetArea}"></div>
                        <input name="colorType" type="radio" id="colorArea"/>
                        <label for="colorArea">区域</label>
                    </div>
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
                +新地形
            </div>
        </div>
    </SideBar>
</template>

<style scoped lang="scss">
.lines>div{
    .colorPanel{
        position: absolute;
        z-index: 10;
        top: 55px;
        left: 10px;
        padding: 5px;
        border-radius: inherit;
        background-color: inherit;
        box-shadow: 0px 0px 5px 2px black;
        display: flex;
        gap: 3px;
        flex-direction: column;
        input[type=color]{
            width: 25px;
            height: 25px;
            padding: 2px 0px 2px 0px;
            box-sizing: border-box;
        }
        input, label{
            cursor: pointer;
        }
        .preset{
            width: 25px;
            height: 25px;
            border-radius: 1000px;
        }
    }
    .colorPanel>div{
        display: flex;
        gap: 2px
    }
}
</style>