<script setup lang="ts">
import { Line } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { onMounted, ref } from 'vue';

const envStore = useEnvStore()
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
    props.line.width = lineWidthBinded.value
    envStore.lineInfoChanged()
}
function textTagCreateBtnClickHandler(){
    envStore.createTextTag(props.line.id)
}

onMounted(()=>{
    lineWidthBinded.value = props.line.width || 1
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
            <div>{{ lineWidthBinded || 1 }}×</div>
        </div>
    </div>
    <div class="configItem">
        <div>填充</div>
        <div class="checkItem">
            <input type="checkbox" v-model="line.isFilled" @change="envStore.lineInfoChanged"/>
        </div>
    </div>
    <div class="configItem">
        <div>标签</div>
        <div class="btnItem">
            <button class="minor" @click="textTagCreateBtnClickHandler">生成标签</button>
            <div class="smallNote">将标签拖到屏幕<br/>左上角即可删除</div>
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
            div{
                color: gray;
                font-size: 12px;
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
    }
    .configTitle{
        font-weight: bold;
        padding: 0px 0px 5px 0px;
        text-align: center;
    }
}
</style>