<script setup lang="ts">
import SideBar from '@/components/common/SideBar.vue';
import { Line, LineStyle, LineType } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { useSaveStore } from '@/models/stores/saveStore';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref } from 'vue';

const envStore = useEnvStore()
const saveStore = useSaveStore()
const { save } = storeToRefs(saveStore)
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

const myUsableLineGroups = computed(()=>{
    return save.value?.lineGroups?.filter(x=>x.lineType===props.line.type) || []
})

const sidebar = ref<InstanceType<typeof SideBar>>()
defineExpose({
    open: ()=>{sidebar.value?.extend()}, 
})

onMounted(()=>{
    lineWidthBinded.value = props.line.width || 1
    lineStyleBinded.value = props.line.style || 0
    lineStaNameSizeBinded.value = props.line.ptNameSize || 0
    lineStaSizeBinded.value = props.line.ptSize || 0
    const gId = props.line.group
    const group = myUsableLineGroups.value.find(x=>x.id===gId)
    if(!group)
        props.line.group = undefined
})
</script>

<template>
<SideBar ref="sidebar">
<h1>线路更多设置</h1>
<div class="lineConfig">
    <table class="fullWidth"><tbody>
    <tr>
        <td colspan="2">
            {{ line.name || '未命名线路' }}
        </td>
    </tr>
    <tr>
        <td colspan="2" :style="{backgroundColor: saveStore.getLineActualColor(line)}"></td>
    </tr>
    <tr>
        <td>分组</td>
        <td>
            <select v-model="line.group" @change="envStore.lineInfoChanged(line)">
                <option :value="undefined">默认分组</option>
                <option v-for="group in myUsableLineGroups" :value="group.id">
                    {{ group.name }}
                </option>
            </select>
            <div class="smallNote">
                可在设置-线路组中添加可选的分组
            </div>
        </td>
    </tr>
    <tr>
        <td>线宽</td>
        <td class="viewableRange">
            <input type="range" v-model="lineWidthBinded"
                :min="lineWidthRange.min"
                :max="lineWidthRange.max"
                :step="lineWidthRange.step" value="1"
                @change="lineWidthChanged"/>
            <input v-if="line.type===LineType.terrain" type="number"
                v-model="lineWidthBinded" @blur="lineWidthChanged"/>
            <div v-else>{{ lineWidthBinded || 1 }}×</div>
        </td>
    </tr>
    <tr v-if="line.type===LineType.common">
        <td>样式</td>
        <td>
            <select v-model="lineStyleBinded" @change="lineStyleChanged">
                <option :value="0">默认</option>
                <option v-for="style in selectableLineStyles" :value="style.id">
                    {{ style.name }}
                </option>
            </select>
            <div class="smallNote">(可在设置-线路样式<br/>自定义更多选项)</div>
        </td>
    </tr>
    <tr v-if="line.type===LineType.common">
        <td>站名</td>
        <td class="viewableRange">
            <input type="range" v-model="lineStaNameSizeBinded"
                :min="0"
                :max="lineWidthRange.max"
                :step="lineWidthRange.step"
                @change="lineStaNameSizeChanged"/>
            <div>{{ lineStaNameSizeBinded || 0 }}×</div>
            <div class="smallNote">(设为0使用全局设置)</div>
        </td>
    </tr>
    <tr v-if="line.type===LineType.common">
        <td>车站</td>
        <td class="viewableRange">
            <input type="range" v-model="lineStaSizeBinded"
                :min="0"
                :max="lineWidthRange.max"
                :step="lineWidthRange.step"
                @change="lineStaSizeChanged"/>
            <div>{{ lineStaSizeBinded || 0 }}×</div>
            <div class="smallNote">(设为0使用全局设置)</div>
        </td>
    </tr>
    <tr v-if="line.type===LineType.terrain">
        <td>填充</td>
        <td>
            <input type="checkbox" v-model="line.isFilled" @change="envStore.lineInfoChanged(line)"/>
            <div class="smallNote">勾选本项时<br/>地形必须是环形</div>
        </td>
    </tr>
    <tr v-if="line.type===LineType.common">
        <td>标签<br/>文字</td>
        <td>
            <div class="selectItem">
                <select v-model="line.tagTextColor" @change="envStore.lineInfoChanged(line)">
                    <option :value="undefined">自动</option>
                    <option :value="'black'">黑色</option>
                    <option :value="'white'">白色</option>
                </select>
            </div>
        </td>
    </tr>
    </tbody></table>
</div>
</SideBar>
</template>

<style scoped lang="scss">
@use './shared/options.scss'
</style>