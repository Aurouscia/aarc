<script setup lang="ts">
import SideBar from '../common/SideBar.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { ColorPreset, Line, LineType } from '@/models/save';
import { useConfigStore } from '@/models/stores/configStore';
import { useSideListShared } from './shared/sideListShared';
import LineConfig from './shared/LineConfig.vue';

const { 
    sidebar, init, lines: terrains, envStore, saveStore,
    registerLinesArrange, disposeLinesArrange, mouseDownLineArrange, arrangingId,
    createLine, delLine, editingInfoLineId, editInfoOfLine
} = useSideListShared(LineType.terrain, '地形')

const cs = useConfigStore()

const editingColorLine = ref<Line>()
function editColorOfLine(line:Line){
    if(line===editingColorLine.value && !!line)
        editingColorLine.value = undefined
    else{
        setTimeout(()=>{
            editingColorLine.value = line
        }, 1)
    }
}

function colorPreChanged(){
    setTimeout(()=>{
        envStore.lineInfoChanged()
    },1)
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
        @extend="registerLinesArrange" @fold="disposeLinesArrange" @click="editingInfoLineId=undefined;editingColorLine=undefined">
        <div class="lines" :class="{arranging: arrangingId >= 0}">
            <div v-for="l in terrains" :key="l.id" :class="{arranging: arrangingId==l.id}">
                <div class="sqrBtn" :class="{sqrActive:editingColorLine?.id===l.id}"
                    :style="{backgroundColor: saveStore.getLineActualColor(l)}"
                    @click="()=>{editColorOfLine(l)}"></div>
                <div v-if="editingColorLine===l" class="colorPanel withShadow" @click="e=>{colorPreChanged();e.stopPropagation()}">
                    <div>
                        <div class="colorInputConatainer">
                            <label for="customColorInput" :style="{backgroundColor:l.color}">　</label>
                            <input v-model="l.color" id="customColorInput" type="color" @blur="colorPreChanged"/>
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