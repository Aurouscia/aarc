<script setup lang="ts">
import SideBar from '@/components/common/SideBar.vue';
import { ControlPoint } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { useNameEditStore } from '@/models/stores/nameEditStore';
import { useSaveStore } from '@/models/stores/saveStore';
import { computed, ref } from 'vue';
import { Line } from '@/models/save';
import { useColorProcStore } from "@/models/stores/utils/colorProcStore";
import { indicesInArrayByPred } from '@/utils/lang/indicesInArray';
const sidebar = ref<InstanceType<typeof SideBar>>()
const nameEditStore = useNameEditStore()
const saveStore = useSaveStore()
const envStore = useEnvStore()
const colorProcStore = useColorProcStore()

const editing = ref<ControlPoint>()
const splittableLinesHere = ref<Line[]>([])
const canBeMergedLinesHere = ref<Line[]>([])
const showLineSplitMenu = ref(false)
const showLineMergeMenu = ref(false)

let mergingLine1Id=-1
let mergingLine2Id=-1
function startEditing(pt: ControlPoint) {
    editing.value = pt
    if(editing.value.nameSize===undefined)
        editing.value.nameSize = 0
    if(editing.value.nameP===undefined)
        editing.value.nameP = nameEditStore.newNamePos(editing.value.id)
    showLineSplitMenu.value = false
    showLineMergeMenu.value = false
    initSplittableLines()
    initmergeableLines()
    sidebar.value?.extend()
}
function initSplittableLines() {
    if(editing.value){
        splittableLinesHere.value = saveStore
            .getLinesByPt(editing.value.id)
            .filter(x => {
                if (isOrCloseToTerminal(x))
                    return false;
                const idxs = indicesInArrayByPred(x.pts, (ptId => ptId === editing.value?.id))
                return idxs.length === 1
            })
    }
}
function initmergeableLines() {
    if(editing.value){
            //初始化一下能合并的线路（就是在这个站是idx=0或者是length-1的）
            canBeMergedLinesHere.value = saveStore
            .getLinesByPt(editing.value.id)
            .filter(x => {
                const idxs = indicesInArrayByPred(x.pts, (ptId => ptId === editing.value?.id))
                return idxs.length === 1&&isTerminal(x)
            })
            mergingLine1Id=-1
            mergingLine2Id=-1
    }
}

//终点站和接近终点站的站不应该显示拆分
function isOrCloseToTerminal(line:Line): boolean{
    if(!editing.value)
        return false
    let indexofPt=line.pts.indexOf(editing.value.id)
    return indexofPt==0||indexofPt==line.pts.length-1||indexofPt==line.pts.length-2||indexofPt==1
}
function isTerminal(line:Line): boolean{
    if(!editing.value)
        return false
    let indexofPt=line.pts.indexOf(editing.value.id)
    return indexofPt==0||indexofPt==line.pts.length-1
}
function splitLineByThisPt(lineId:number, lineName:string){
    if(!editing.value){
        return
    }
    if(!window.confirm(`确认以本点为界拆分[${lineName}]？`)){
        return
    }
    envStore.splitLineByPt(lineId, editing.value.id)
    initSplittableLines() //完成后立即更新可拆分的线路
}
function mergeLinesByThisPt(line1Id:number,line2Id:number){
    if(!editing.value){
        return
    }
    if (!saveStore.save)
    {return}
    let Line1=saveStore.save.lines.find(x=>x.id==line1Id)
    let Line2=saveStore.save.lines.find(x=>x.id==line2Id)
    if (!Line1){
        return
    }
    if (!Line2){
        return
    }
    if (line1Id==line2Id){
        window.alert('不能把线路和自己合并！')
        return
    }
    if(!window.confirm(`确认将[${Line2.name}]合并到[${Line1.name}]？`)){
        return
    }
    envStore.mergeLinesByPt(line1Id,line2Id, editing.value.id)
    initmergeableLines() //完成后立即更新可合并的线路
}

const isLineTypeWithoutSta = computed<boolean>(()=>{
    if(!editing.value)
        return false
    const relatedLines = saveStore.getLinesByPt(editing.value.id)
    const relatedLineTypes = relatedLines.map(line=>line.type)
    return saveStore.isLineTypeWithoutSta(relatedLineTypes)
})

const emit = defineEmits<{
    (e:'changed'):void
}>()

defineExpose({
    startEditing
})
</script>

<template>
<SideBar ref="sidebar">
    <div v-if="editing">
        <h2>点坐标</h2>
        <div class="optionSection">
            <table class="fullWidth"><tbody>
                <tr>
                    <td>坐标</td>
                    <td class="coord">
                        <input type="number" v-model.number="editing.pos[0]"
                            @change="emit('changed');envStore.movedPoint=true"/><br/>
                        <input type="number" v-model.number="editing.pos[1]"
                            @change="emit('changed');envStore.movedPoint=true"/>
                    </td>
                </tr>
            </tbody></table>
        </div>
        <div v-if="!isLineTypeWithoutSta">
            <h2>站名尺寸</h2>
            <div class="optionSection">
                <div class="viewableRange" v-if="editing.nameSize!==undefined">
                    <input type="range" v-model.number="editing.nameSize" :min="0" :max="3" :step="0.25" @change="emit('changed')"/>
                    <input type="number" v-model.number="editing.nameSize" :min="0" :max="3" @change="emit('changed')"/>
                </div>
                <div class="smallNote" style="text-align: center;">
                    设为0使用默认大小<br/>
                    （即车站团内最大的“线路设置站名尺寸”）<br/><br/>
                    此处的设置仅影响本点，若站名被拖入<br/>车站团内其他点，则需要重新设置
                </div>
            </div>
            <h2>站名位置</h2>
            <div class="optionSection">
                <table class="fullWidth" v-if="editing.nameP"><tbody>
                    <tr>
                        <td>坐标</td>
                        <td class="coord">
                            <input type="number" v-model.number="editing.nameP[0]" @change="emit('changed')"/><br/>
                            <input type="number" v-model.number="editing.nameP[1]" @change="emit('changed')"/>
                        </td>
                    </tr>
                </tbody></table>
            </div>
            <h2>拆分线路</h2>
            <div class="optionSection">
                <button v-if="!showLineSplitMenu" @click="showLineSplitMenu=true"
                    class="minor" style="margin: auto;display: block;"
                >此处可拆{{ splittableLinesHere.length }}条线路</button>
                <template v-else>
                    <table class="fullWidth"><tbody>
                        <tr>
                            <td>拆分</td>
                            <td v-if="splittableLinesHere.length>0">
                                <div v-for="spl in splittableLinesHere">
                                    <button :style="{
                                        backgroundColor:spl.color,
                                        color:spl.tagTextColor ?? colorProcStore.colorProcInvBinary.convert(spl.color)
                                        }"
                                        @click="splitLineByThisPt(spl.id, spl.name)"
                                    >
                                    {{ spl.name }}
                                    </button>
                                </div>
                            </td>
                            <td v-else>此处无可拆线路</td>
                        </tr>
                    </tbody></table>
                    <div class="smallNote">
                        无法拆分：线路端点、线路端点的邻点、线路自交点（注：环线也有端点）<br>
                        如果非上述情况依然不能拆分，请尝试使用“设置-杂项-修复线路节点重复问题”或咨询管理员
                    </div>
                </template>
            </div>
            <h2>合并线路</h2>
            <div class="optionSection">
                <button v-if="!showLineMergeMenu&&canBeMergedLinesHere.length>1" @click="showLineMergeMenu=true"
                    class="minor" style="margin: auto;display: block;"
                >有{{ canBeMergedLinesHere.length }}条线路以此为端点</button>
                <template v-else>
                    <div v-if="canBeMergedLinesHere.length>1">
                    <table class="fullWidth" ><tbody>
                        <tr>
                            <td>线路1：</td>
                            <td >
                                <select v-model="mergingLine1Id"  @change="emit('changed')">
                                    <div  v-for="line in canBeMergedLinesHere">
                                        <option :value="line.id">
                                            {{line.name}}
                                        </option>
                                    </div>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td>线路2：</td>
                            <td >
                                <select v-model="mergingLine2Id"  @change="emit('changed')">
                                    <div  v-for="line in canBeMergedLinesHere">
                                        <option :value="line.id">
                                            {{line.name}}
                                        </option>
                                    </div>
                                </select>
                            </td>
                        </tr>
                    </tbody></table>
                    <button @click="mergeLinesByThisPt(mergingLine1Id,mergingLine2Id)">
                        合并
                    </button>
                    </div>
                    
                    <div v-else>
                        此处无可合并线路
                        <div class="smallNote" style="text-align: center;">
                            （显然，有至少两条符合条件的线路才能进行合并）
                        </div>
                    </div>
                    <div class="smallNote">
                        首尾相接的线路都可以合并，除非这个点是自交点
                        <br>
                        合并后，线路2将自动被移除，线路属性和线路1相同
                        <br>
                        线路2如果有支线，也会被归为线路1的支线
                    </div>
                </template>
            </div>
        </div>
    </div>
    <div class="smallNote" style="text-align: center;">
        <b>右键点击站名</b>可直接打开本菜单<br/>
        <b>右键点击站点</b>可以旋转站点<br/>
        <b>右键+ctrl点击站点</b>可以切换站点显示
    </div>
</SideBar>
</template>

<style scoped lang="scss">
@use './shared/options.scss';
</style>