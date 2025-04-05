<script setup lang="ts">
import { Line, LineStyle, LineType } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { useSaveStore } from '@/models/stores/saveStore';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

const envStore = useEnvStore()
const { save } = storeToRefs(useSaveStore())
const props = defineProps<{
    line:Line,
    lineWidthRange:{
        min:number,
        max:number,
        step:number
    }
}>()
const lineWidthBinded = ref(1)
function lineWidthChanged(){
    const changed = (props.line.width || 1) !== (lineWidthBinded.value || 1)
    props.line.width = lineWidthBinded.value
    envStore.lineInfoChanged(props.line, changed)
}
const lineStyleBinded = ref<number>() //0为默认值（无样式）
const selectableLineStyles = computed<LineStyle[]>(()=>{
    return save.value?.lineStyles?.map(x=>{
        const copy = {...x}
        if(!copy.name){
            copy.name = '未命名样式'
        }
        return copy
    }) || []
})
function lineStyleChanged(){
    props.line.style = lineStyleBinded.value
    envStore.lineInfoChanged(props.line)
}
const lineStaNameSizeBinded = ref(1)
function lineStaNameSizeChanged(){
    props.line.ptNameSize = lineStaNameSizeBinded.value
    envStore.lineInfoChanged(props.line)
}
const lineStaSizeBinded = ref(1)
function lineStaSizeChanged(){
    props.line.ptSize = lineStaSizeBinded.value
    envStore.lineInfoChanged(props.line)
}

onMounted(()=>{
    lineWidthBinded.value = props.line.width || 1
    lineStyleBinded.value = props.line.style || 0
    lineStaNameSizeBinded.value = props.line.ptNameSize || 0
    lineStaSizeBinded.value = props.line.ptSize || 0
})
</script>

<template>
<div class="lineConfig withShadow" @click="e=>e.stopPropagation()">
    <div class="configTitle">设置</div>
    <div class="configItem">
        <div>线宽</div>
        <div class="slideBarItem">
            <input type="range" v-model="lineWidthBinded"
                :min="lineWidthRange.min"
                :max="lineWidthRange.max"
                :step="lineWidthRange.step" value="1"
                @change="lineWidthChanged"/>
            <input v-if="line.type===LineType.terrain" type="number"
                v-model="lineWidthBinded" @blur="lineWidthChanged"/>
            <div v-else>{{ lineWidthBinded || 1 }}×</div>
        </div>
    </div>
    <div v-if="line.type===LineType.common" class="configItem">
        <div>样式</div>
        <div class="selectItem">
            <select v-model="lineStyleBinded" @change="lineStyleChanged">
                <option :value="0">默认</option>
                <option v-for="style in selectableLineStyles" :value="style.id">
                    {{ style.name }}
                </option>
            </select>
            <div>(可在设置-线路样式<br/>自定义更多选项)</div>
        </div>
    </div>
    <div v-if="line.type===LineType.common" class="configItem">
        <div>站名</div>
        <div class="slideBarItem">
            <input type="range" v-model="lineStaNameSizeBinded"
                :min="0"
                :max="lineWidthRange.max"
                :step="lineWidthRange.step"
                @change="lineStaNameSizeChanged"/>
            <div>{{ lineStaNameSizeBinded || 0 }}×</div>
            <div>(设为0使用全局设置)</div>
        </div>
    </div>
    <div v-if="line.type===LineType.common" class="configItem">
        <div>车站</div>
        <div class="slideBarItem">
            <input type="range" v-model="lineStaSizeBinded"
                :min="0"
                :max="lineWidthRange.max"
                :step="lineWidthRange.step"
                @change="lineStaSizeChanged"/>
            <div>{{ lineStaSizeBinded || 0 }}×</div>
            <div>(设为0使用全局设置)</div>
        </div>
    </div>
    <div v-if="line.type===LineType.terrain" class="configItem">
        <div>填充</div>
        <div class="checkItem">
            <input type="checkbox" v-model="line.isFilled" @change="envStore.lineInfoChanged(line)"/>
            <div>勾选本项时<br/>地形必须是环形</div>
        </div>
    </div>
    <div v-if="line.type===LineType.common" class="configItem">
        <div>标签<br/>文字</div>
        <div style="flex-grow: 1;">
            <div class="selectItem">
                <select v-model="line.tagTextColor" @change="envStore.lineInfoChanged(line)">
                    <option :value="undefined">自动</option>
                    <option :value="'black'">黑色</option>
                    <option :value="'white'">白色</option>
                </select>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped lang="scss">
.lineConfig{
    background-color: white;
    padding: 10px;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    .configItem{
        display: flex;
        gap: 10px;
        justify-content: space-between;
        align-items: center;
        white-space: nowrap;
        border-top: 1px solid #ccc;
        padding: 5px 0px 5px 0px;
        .slideBarItem{
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0px;
            input[type=number]{
                width: 60px;
            }
            input[type=range]{
                width: 120px
            }
        }
        .checkItem{
            flex-grow: 1;
            text-align: center;
            input[type=checkbox]{
                width: 20px;
                height: 20px;
            }
        }
        .btnItem{
            flex-grow: 1;
            text-align: center;
        }
        .selectItem{
            flex-grow: 1;
            text-align: center;
            select{
                max-width: 120px;
                font-size: 14px;
            }
        }
        .slideBarItem, .selectItem, .checkItem{
            div{
                color: gray;
                font-size: 12px;
            }
        }
    }
    .configTitle{
        font-weight: bold;
        padding: 0px 0px 5px 0px;
        text-align: center;
    }
}
</style>