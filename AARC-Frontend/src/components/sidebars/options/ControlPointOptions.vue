<script setup lang="ts">
import SideBar from '@/components/common/SideBar.vue';
import { ControlPoint } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { useNameEditStore } from '@/models/stores/nameEditStore';
import { useSaveStore } from '@/models/stores/saveStore';
import { computed, ref, useTemplateRef } from 'vue';
import { Line } from '@/models/save';
import { useColorProcStore } from "@/models/stores/utils/colorProcStore";
import { indicesInArrayByPred } from '@/utils/lang/indicesInArray';
import { isRing } from '@/utils/lineUtils/isRing';

const sidebar = useTemplateRef('sidebar')
const nameEditStore = useNameEditStore()
const saveStore = useSaveStore()
const envStore = useEnvStore()
const colorProcStore = useColorProcStore()

const editing = ref<ControlPoint>()
const showLineSplitMenu = ref(false)
const splittableLinesHere = ref<Line[]>([])
const showLineMergeMenu = ref(false)
const mergeableLinesHere = ref<Line[]>([])
const canMergeLinesHere = computed<boolean>(()=>mergeableLinesHere.value.length>1)
const mergingLine1Id = ref<number>(0)
const mergingLine2Id = ref<number>(0)

function startEditing(pt: ControlPoint) {
    editing.value = pt
    if(editing.value.nameSize===undefined)
        editing.value.nameSize = 0
    if(editing.value.nameP===undefined)
        editing.value.nameP = nameEditStore.optimizedNamePos(editing.value.id)
    showLineSplitMenu.value = false
    showLineMergeMenu.value = false
    initSplittableLines()
    initMergeableLines()
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
function initMergeableLines() {
    if(editing.value){
        //初始化一下能合并的线路（就是在这个站是端点的）
        mergeableLinesHere.value = saveStore
            .getLinesByPt(editing.value.id)
            .filter(x => {
                if(!isTerminal(x))
                    return false //此处不是端点：排除
                if(isRing(x))
                    return false //此处是环线端点：排除
                return true //其他情况（是端点而且不是环线）：加入
            })
        mergingLine1Id.value = 0
        mergingLine2Id.value = 0
    }
}

//终点站和接近终点站的站不应该显示拆分
function isOrCloseToTerminal(line:Line): boolean{
    if(!editing.value)
        return false
    if(isTerminal(line))
        return true
    const pt = editing.value.id
    const pt1 = line.pts.at(1)
    const ptLastBut1 = line.pts.at(-2)
    return pt == pt1 || pt == ptLastBut1
}
function isTerminal(line:Line): boolean{
    if(!editing.value)
        return false
    const pt = editing.value.id
    const pt0 = line.pts.at(0)
    const ptLast = line.pts.at(-1)
    return pt == pt0 || pt == ptLast
}
function splitLineByThisPt(lineId:number, lineName:string){
    if(!editing.value){
        return
    }
    if(!window.confirm(`确认以本点为界拆分【${lineName}】？`)){
        return
    }
    envStore.splitLineByPt(lineId, editing.value.id)
    initSplittableLines() //完成后立即更新可拆分的线路
}
function mergeLinesByThisPt(){
    const line1Id = mergingLine1Id.value
    const line2Id = mergingLine2Id.value
    if(!editing.value || !saveStore.save || !line1Id || !line2Id)
        return
    if (line1Id == line2Id){
        window.alert('不能把线路和自己合并！')
        return
    }
    let line1 = saveStore.save.lines.find(x=>x.id==line1Id)
    let line2 = saveStore.save.lines.find(x=>x.id==line2Id)
    if(!line1 || !line2)
        return
    if(!window.confirm(`确认删除【${line2.name}】并将其站点合并到【${line1.name}】？`)){
        return
    }
    envStore.mergeLinesByPt(line1Id, line2Id, editing.value.id)
    initMergeableLines() //完成后立即更新可合并的线路
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
    <div v-if="editing" class="options">
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
                <button v-if="!showLineMergeMenu" @click="showLineMergeMenu=true"
                    class="minor" style="margin: auto;display: block;"
                >{{ canMergeLinesHere ? '此处可以合并线路':'此处无法合并线路' }}</button>
                <template v-else>
                    <table class="fullWidth"><tbody>
                        <template v-if="canMergeLinesHere">
                            <tr>
                                <td>保留</td>
                                <td>
                                    <select v-model="mergingLine1Id" class="lineMergeSelect">
                                        <option :value="0">请选择线路</option>
                                        <option v-for="line in mergeableLinesHere" :value="line.id">
                                            {{line.name}}
                                        </option>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <td>消失</td>
                                <td>
                                    <select v-model="mergingLine2Id" class="lineMergeSelect">
                                        <option :value="0">请选择线路</option>
                                        <option v-for="line in mergeableLinesHere" :value="line.id">
                                            {{line.name}}
                                        </option>
                                    </select>
                                </td>
                            </tr>
                            <tr v-if="mergingLine1Id && mergingLine2Id && mergingLine1Id!==mergingLine2Id">
                                <td colspan="2">
                                    <button @click="mergeLinesByThisPt">
                                        合并
                                    </button>
                                </td>
                            </tr>
                        </template>
                        <tr v-else>
                            <td>此处无法合并线路</td>
                        </tr>
                    </tbody></table>
                    <div class="smallNote">
                        无法合并：至少2条线路以此为端点（环线端点除外）才能进行合并，环线需先手动移除端点
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
.lineMergeSelect{
    max-width: 180px;
}
</style>