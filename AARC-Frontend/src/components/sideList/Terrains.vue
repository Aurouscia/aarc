<script setup lang="ts">
import SideBar from '../common/SideBar.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { ColorPreset, Line, LineType } from '@/models/save';
import { useConfigStore } from '@/models/stores/configStore';
import { useSideListShared } from './shared/sideListShared';

const { 
    sidebar, init, lines: terrains, envStore, saveStore,
    registerLinesArrange, disposeLinesArrange, mouseDownLineArrange, arrangingId,
    createLine, delLine
} = useSideListShared(LineType.terrain, '地形')

const cs = useConfigStore()

const editingColorLine = ref<Line>()
function toggleEditingColorLineId(line?:Line){
    if(line===editingColorLine.value && !!line)
        editingColorLine.value = undefined
    else
        editingColorLine.value = line
}

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
        @extend="registerLinesArrange" @fold="disposeLinesArrange" @click="toggleEditingColorLineId()">
        <div class="lines" :class="{arranging: arrangingId >= 0}">
            <div v-for="l in terrains" :key="l.id" :class="{arranging: arrangingId==l.id}">
                <div class="sqrBtn" :style="{backgroundColor: saveStore.getLineActualColor(l)}"
                    @click="e=>{toggleEditingColorLineId(l);e.stopPropagation()}"></div>
                <div v-if="editingColorLine===l" class="colorPanel" @click="e=>e.stopPropagation()">
                    <div>
                        <div class="colorInputConatainer">
                            <label for="customColorInput" :style="{backgroundColor:l.color}">　</label>
                            <input v-model="l.color" id="customColorInput" type="color" @blur="envStore.lineColorChanged"/>
                        </div>
                        <input name="colorType" type="radio" id="colorCustom" :value="undefined" v-model="l.colorPre"/>
                        <label for="colorCustom">自定义</label>
                    </div>
                    <div>
                        <div class="preset" :style="{backgroundColor: cs.config.colorPresetWater}"></div>
                        <input name="colorType" type="radio" id="colorWater" :value="ColorPreset.water" v-model="l.colorPre"/>
                        <label for="colorWater">水系</label>
                    </div>
                    <div>
                        <div class="preset" :style="{backgroundColor: cs.config.colorPresetGreenland}"></div>
                        <input name="colorType" type="radio" id="colorGreenland" :value="ColorPreset.greenland" v-model="l.colorPre"/>
                        <label for="colorGreenland">绿地</label>
                    </div>
                    <div>
                        <div class="preset" :style="{backgroundColor: cs.config.colorPresetArea}"></div>
                        <input name="colorType" type="radio" id="colorArea" :value="ColorPreset.area" v-model="l.colorPre"/>
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
    position: relative;
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