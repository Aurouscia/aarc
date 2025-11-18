<script setup lang="ts">
import SideBar from '@/components/common/SideBar.vue';
import { Line, LineStyle, LineType } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { useSaveStore } from '@/models/stores/saveStore';
import { storeToRefs } from 'pinia';
import { computed, CSSProperties, onMounted, ref, watch } from 'vue';
import ColorPickerForLine from '../shared/ColorPickerForLine.vue';
import ColorPickerForTerrain from '../shared/ColorPickerForTerrain.vue';

const envStore = useEnvStore()
const saveStore = useSaveStore()
const { save } = storeToRefs(saveStore)
const props = defineProps<{
    line:Line,
    lineTypeCalled:string,
    lineWidthRange:{
        min:number,
        max:number,
        step:number
    }
}>()
const selectableLineStyles = computed<LineStyle[]>(()=>{
    return save.value?.lineStyles?.map(x=>{
        const copy = {...x}
        if(!copy.name){
            copy.name = '未命名样式'
        }
        return copy
    }) || []
})

function isInSameFamily(line:Line){
    const p = props.line
    if(line.id===p.id)
        return true
    if(line.parent && line.parent===p.parent)
        return true
    if(line.id===p.parent || line.parent===p.id)
        return true
    return false
}
const lineZIndexSameLines = computed<{n:string,c:string}[]>(()=>{
    if(!props.line.zIndex)
        return []
    const sameLines = saveStore.save?.lines.filter(x=>{
        if(x.parent)
            return false
        if(isInSameFamily(x))
            return false
        if(x.zIndex!==props.line.zIndex)
            return false
        return true
    })
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
const haveChildren = computed(()=>{
    return saveStore.save?.lines.some(x=>x.parent && x.parent == props.line.id) || false
})
const haveParent = computed(()=>!!props.line.parent)

const picker0 = ref<InstanceType<typeof ColorPickerForLine>>()
const picker1 = ref<InstanceType<typeof ColorPickerForTerrain>>()
function closePickers(){
    picker0.value?.close()
    picker1.value?.close()
}
const pickerEntryStyles:CSSProperties = {
    width: '240px', height: '26px'
}

//防抖机制（停止操作一段时间后触发重绘，且按需重新计算车站团）
let reportExecTimer = 0
let reportExecSizeChanged = false
function reportInfoChanged(staSizeChanged?:boolean){
    window.clearTimeout(reportExecTimer)
    reportExecSizeChanged = reportExecSizeChanged || !!staSizeChanged
    reportExecTimer = window.setTimeout(()=>{
        envStore.lineInfoChanged(props.line, reportExecSizeChanged)
        reportExecSizeChanged = false
    }, 500)
}

const sidebar = ref<InstanceType<typeof SideBar>>()
defineExpose({
    open: ()=>{sidebar.value?.extend()}, 
    fold: ()=>{sidebar.value?.fold()}
})
const emit = defineEmits<{
    (e:'colorUpdated'):void
}>()

function init(){
    ensureLineNumOptionsNum()
    const gId = props.line.group
    const group = myUsableLineGroups.value.find(x=>x.id===gId)
    if(!group)
        props.line.group = undefined
}
watch(props.line, ()=>{
    ensureLineNumOptionsNum()
})
function ensureLineNumOptionsNum(){
    props.line.width ||= 1
    props.line.style ||= 0
    props.line.ptNameSize ||= 0
    props.line.ptSize ||= 0
    props.line.zIndex ||= 0
}

function foldHander(){
    if(envStore.activeLine){
        envStore.cancelActive()
        envStore.closeOps()
    }
}

onMounted(()=>{
    init()
})
</script>

<template>
<SideBar ref="sidebar" @extend="init" @click="closePickers" @fold="foldHander">
<div class="options">
    <table class="fullWidth"><tbody>
    <tr>
        <td colspan="2" class="nameAndColorTd">
            <div>
                <input v-model.lazy.trim="line.name" @blur="reportInfoChanged(false)"/>
                <input v-model.lazy.trim="line.nameSub" @blur="reportInfoChanged(false)"/>
                <template v-if="!haveParent">
                    <ColorPickerForLine ref="picker0" v-if="line.type===LineType.common" :line="line"
                        :entry-styles="pickerEntryStyles" @color-updated="emit('colorUpdated')"></ColorPickerForLine> 
                    <ColorPickerForTerrain ref="picker1" v-if="line.type===LineType.terrain" :line="line"
                        :entry-styles="pickerEntryStyles" @color-updated="emit('colorUpdated')"></ColorPickerForTerrain>
                </template>
            </div>
        </td>
    </tr>
    <template v-if="!haveParent">
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
            <input type="range" v-model.number="props.line.width"
                :min="lineWidthRange.min"
                :max="lineWidthRange.max"
                :step="lineWidthRange.step"
                @change="reportInfoChanged(true)"
                />
            <input  type="number" min="0"
                v-model.number.lazy="props.line.width" @blur="reportInfoChanged(true)"/>
        </td>
    </tr>
    <tr v-if="line.type===LineType.common">
        <td>样式</td>
        <td>
            <select v-model="props.line.style" @change="reportInfoChanged(true)">
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
            <input type="range" v-model.number="props.line.ptNameSize"
                :min="0"
                :max="2"
                :step="0.25"
                @change="reportInfoChanged(false)"
                />
            <input type="number" v-model.number.lazy="props.line.ptNameSize"
                :min="0"
                :max="2"
                :step="0.05"
                @blur="reportInfoChanged(false)"
                />
            <div class="smallNote">(设为0使用"设置-线宽对应<br/>车站尺寸"中的全局设置)</div>
        </td>
    </tr>
    <tr v-if="line.type===LineType.common">
        <td>车站</td>
        <td class="viewableRange">
            <input type="range" v-model.number="props.line.ptSize"
                :min="0"
                :max="2"
                :step="0.25"
                @change="reportInfoChanged(true)"
                />
            <input type="number" v-model.number.lazy="props.line.ptSize"
                :min="0"
                :max="2"
                :step="0.05"
                @blur="reportInfoChanged(true)"
                />
            <div class="smallNote">(设为0使用"设置-线宽对应<br/>车站尺寸"中的全局设置)</div>
        </td>
    </tr>
    <tr v-if="line.type===LineType.terrain">
        <td>填充</td>
        <td>
            <input type="checkbox" v-model="line.isFilled" @change="reportInfoChanged(false)"/>
            <div class="smallNote">勾选本项时<br/>地形必须是环形</div>
        </td>
    </tr>
    <tr v-if="line.type===LineType.common">
        <td>去除<br/>白边</td>
        <td>
            <input type="checkbox" v-model="line.removeCarpet" @change="reportInfoChanged(false)"/>
            <div class="smallNote">线路将不会有底层的白边</div>
        </td>
    </tr>
    <tr>
    <td>层级</td>
        <td class="viewableRange">
            <input type="range" v-model.number="props.line.zIndex"
                :min="-9"
                :max="9"
                :step="1"
                @change="reportInfoChanged(false)"
                />
            <input type="number" v-model.number.lazy="props.line.zIndex"
                @blur="reportInfoChanged(false)"/>
            <div v-if="!props.line.zIndex" class="smallNote">
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
            <button @click="envStore.createTextTag(line.id)" class="minor">
                点击创建
            </button>
        </td>
    </tr>
    <tr v-if="line.type===LineType.common">
        <td>标签<br/>文字</td>
        <td>
            <div class="selectItem">
                <select v-model="line.tagTextColor" @change="reportInfoChanged(false)">
                    <option :value="undefined">自动</option>
                    <option :value="'black'">黑色</option>
                    <option :value="'white'">白色</option>
                </select>
            </div>
        </td>
    </tr>
    <tr v-if="!line.parent && line.type===LineType.common">
        <td>归为<br/>支线</td>
        <td v-if="!haveChildren">
            <select v-model="selectedForParentAssignment" style="max-width: 160px;">
                <option :value="undefined">无所属</option>
                <option v-for="l in selectableParent"
                    :value="l.id">{{ l.name ?? '未命名线路' }}</option>
            </select><br/>
            <button v-if="selectedForParentAssignment" @click="assignParent">归为选中线路的支线</button>
        </td>
        <td v-else>
            <div class="smallNote">请先删除该线路的支线</div>
        </td>
    </tr>
    <tr>
        <td>伪线</td>
        <td>
            <input v-model="line.isFake" type="checkbox" @change="reportInfoChanged(false)"/>
            <div class="smallNote">
                如果线路是类似"图例"的作用<br/>
                请勾选，将不会出现在略缩图中<br/>
                也不会被算入线路数量
            </div>
        </td>
    </tr>
    </template>
    </tbody></table>
    <table v-if="haveParent" class="fullWidth"><tbody>
        <tr>
            <td>标签<br/>创建</td>
            <td>
                <button @click="envStore.createTextTag(line.id)" class="minor">
                    点击创建
                </button>
            </td>
        </tr>
        <tr>
            <td colspan="2" class="mediumNote">本线路为支线，不能单独设置<br/>请对其所属的主线进行设置</td>
        </tr>
    </tbody></table>
</div>
<div class="smallNote" style="text-align: center;margin-bottom: 60px;"><b>
    提示：右键点击线路可直接打开本菜单
</b></div>
</SideBar>
</template>

<style scoped lang="scss">
.nameAndColorTd{
    background-color: white;
    &>div{
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        input{
            background-color: #eee;
            text-align: center;
            margin: 0px;
            font-size: 14px;
            width: 240px;
            border: none;
        }
        input:first-child{
            font-size: 18px;
        }
    }
}
.sameZIndexLines{
    max-width: 200px;
    span{
        margin-right: 3px;
        white-space: nowrap;
    }
}
</style>