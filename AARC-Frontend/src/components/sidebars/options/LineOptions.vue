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
    envStore.lineInfoChanged(props.line, true)
}
const lineZIndexBinded = ref(0)
function lineZIndexChanged(){
    props.line.zIndex = lineZIndexBinded.value
    envStore.lineInfoChanged(props.line)
}
const lineZIndexSameLines = computed<{n:string,c:string}[]>(()=>{
    if(lineZIndexBinded.value===0)
        return []
    const sameLines = saveStore.save?.lines.filter(x=>x.id!==props.line.id && x.zIndex===lineZIndexBinded.value)
    return sameLines?.map(x=>{
        return {n:x.name||'未命名线路', c:saveStore.getLineActualColor(x)}
    }) ?? []
})

const myUsableLineGroups = computed(()=>{
    return save.value?.lineGroups?.filter(x=>x.lineType===props.line.type) || []
})

const selectableParent = computed<Line[]>(()=>{
    return save.value?.lines.filter(x=>{
        return x.type === LineType.common && !x.parent && x.id !== props.line.id
    }) ?? []
})
const selectedForParentAssignment = ref<number>()
function assignParent(){
    if(selectedForParentAssignment.value){
        const parentLine = saveStore.getLineById(selectedForParentAssignment.value)
        if(parentLine){
            props.line.parent = selectedForParentAssignment.value
            envStore.ensureChildrenOptionsSame(parentLine.id)
            saveStore.ensureLinesOrdered()
            envStore.rerender([], [])
        }
    }
}

const sidebar = ref<InstanceType<typeof SideBar>>()
defineExpose({
    open: ()=>{sidebar.value?.extend()}, 
    fold: ()=>{sidebar.value?.fold()}
})

function init(){
    lineWidthBinded.value = props.line.width || 1
    lineStyleBinded.value = props.line.style || 0
    lineStaNameSizeBinded.value = props.line.ptNameSize || 0
    lineStaSizeBinded.value = props.line.ptSize || 0
    lineZIndexBinded.value = props.line.zIndex || 0
    const gId = props.line.group
    const group = myUsableLineGroups.value.find(x=>x.id===gId)
    if(!group)
        props.line.group = undefined
}

onMounted(()=>{
    init()
})
</script>

<template>
<SideBar ref="sidebar" @extend="init">
<h1>线路更多设置</h1>
<div class="lineConfig">
    <table v-if="!line.parent" class="fullWidth"><tbody>
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
            <select v-model="line.group" @change="saveStore.ensureLinesOrdered();envStore.lineInfoChanged(line)">
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
    <tr>
        <td>层级</td>
        <td class="viewableRange">
            <input type="range" v-model="lineZIndexBinded"
                :min="-9"
                :max="9"
                :step="1"
                @change="lineZIndexChanged"/>
                <input type="number" v-model="lineZIndexBinded" @blur="lineZIndexChanged"/>
            <div v-if="lineZIndexBinded==0" class="smallNote">
                控制线路的显示顺序<br/>高层级会盖住低层级
            </div>
            <div v-else-if="lineZIndexSameLines.length>0" class="smallNote sameZIndexLines">
                使用该层级的其他线路：<br/>
                <span v-for="szl in lineZIndexSameLines" :style="{color:szl.c}">{{ szl.n }}</span>
            </div>
            <div v-else class="smallNote">
                使用该层级的其他线路：<br/>
                <span>无</span>
            </div>
        </td>
    </tr>
    <tr>
        <td>标签<br/>创建</td>
        <td>
            <button @click="envStore.createTextTag(line.id)">
                点击创建
            </button>
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
    <tr v-if="!line.parent">
        <td>归为<br/>支线</td>
        <td>
            <select v-model="selectedForParentAssignment">
                <option :value="undefined">无所属</option>
                <option v-for="l in selectableParent"
                    :value="l.id">{{ l.name ?? '未命名线路' }}</option>
            </select><br/>
            <button v-if="selectedForParentAssignment" @click="assignParent">归为选中线路的支线</button>
        </td>
    </tr>
    </tbody></table>
    <table v-else class="fullWidth"><tbody>
        <tr>
            <td>标签<br/>创建</td>
            <td>
                <button @click="envStore.createTextTag(line.id)">
                    点击创建
                </button>
            </td>
        </tr>
        <tr>
            <td colspan="2" class="mediumNote">本线路为支线，不能单独设置<br/>请对其所属的主线进行设置</td>
        </tr>
    </tbody></table>
</div>
</SideBar>
</template>

<style scoped lang="scss">
@use './shared/options.scss';

.sameZIndexLines{
    max-width: 200px;
    span{
        margin-right: 3px;
        white-space: nowrap;
    }
}
table{
    margin-bottom: 60px;
}
</style>