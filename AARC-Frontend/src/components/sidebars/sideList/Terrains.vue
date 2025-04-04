<script setup lang="ts">
import SideBar from '../../common/SideBar.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { Line, LineType } from '@/models/save';
import { useSideListShared } from './shared/useSideListShared';
import LineConfig from './shared/LineConfig.vue';
import { AuColorPickerPresetsNested } from '@aurouscia/au-color-picker';
import { useColorPresetNames } from './shared/useColorPresetNames';
import LineDelPrompt from './shared/LineDelPrompt.vue';

const { 
    sidebar, lines: terrains, envStore,
    registerLinesArrange, disposeLinesArrange, mouseDownLineArrange, arrangingId,
    createLine, editingInfoLineId, editInfoOfLine,
    wantDelLine, delLineStart, delLineAbort, delLineExe
} = useSideListShared(LineType.terrain, '地形')

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
    editingInfoLineId.value = undefined
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
    <SideBar ref="sidebar" :shrink-way="'v-show'" class="arrangeableList"
        @extend="registerLinesArrange" @fold="disposeLinesArrange" @click="clickContainer">
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
                <div class="names">
                    <input v-model="l.name" placeholder="输入地形名" @blur="envStore.lineInfoChanged(l)"/>
                    <input v-model="l.nameSub" placeholder="输入地形副名" @blur="envStore.lineInfoChanged(l)"/>
                </div>
                <div class="infoEdit">
                    <div class="sqrBtn" :class="{sqrActive:editingInfoLineId===l.id}" @click="editInfoOfLine(l.id)">...</div>
                    <div v-if="editingInfoLineId===l.id" class="infoEditPanel">
                        <LineConfig :line="l" :line-width-range="{min:0.5, max:12, step:0.5}"></LineConfig>
                    </div>
                </div>
                <div class="sqrBtn moveBtn" :class="{sqrActive:arrangingId===l.id}"
                    @mousedown="e => mouseDownLineArrange(e, l.id)"
                    @touchstart="e => mouseDownLineArrange(e, l.id)">
                    ⇅
                </div>
                <div class="sqrBtn" @click="delLineStart(l)">
                    ×
                </div>
            </div>
            <div class="newLine" @click="createLine">
                +新地形
            </div>
        </div>
    </SideBar>
    <LineDelPrompt :line="wantDelLine" :line-called="'地形'" :pt-called="'节点'" :with-sta-default="true"
        @abort="delLineAbort" @exe="delLineExe"></LineDelPrompt>
</template>

<style scoped lang="scss">
input{margin: 0px;padding: 0px;}

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