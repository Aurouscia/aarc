<script setup lang="ts">
import SideBar from '@/components/common/SideBar.vue';
import { ControlPoint } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { useNameEditStore } from '@/models/stores/nameEditStore';
import { useSaveStore } from '@/models/stores/saveStore';
import { computed, ref } from 'vue';
import { Line } from '@/models/save';
import { useColorProcStore } from "@/models/stores/utils/colorProcStore";
const sidebar = ref<InstanceType<typeof SideBar>>()
const nameEditStore = useNameEditStore()
const saveStore = useSaveStore()
const envStore = useEnvStore()
const colorProcStore = useColorProcStore()

const editing = ref<ControlPoint>()
function startEditing(pt: ControlPoint) {
    editing.value = pt
    if(editing.value.nameSize===undefined)
        editing.value.nameSize = 0
    if(editing.value.nameP===undefined)
        editing.value.nameP = nameEditStore.newNamePos(editing.value.id)
    sidebar.value?.extend()
    if(editing.value!=undefined){
    linesInPt = saveStore.getLinesByPt(editing.value.id)
}
}

let linesInPt:Line[] = []

//终点站不应该显示拆分
function isTerminal(line:Line): boolean{
    if(!editing.value)
        return false
    let indexofPt=line.pts.indexOf(editing.value.id)
    if (indexofPt==0||indexofPt==line.pts.length-1)
    return true
    else
    return false
}
function splitLineByPtF(lineId:number,ptId:number){
    envStore.splitLineByPt(lineId,ptId)
    envStore.rerender([],[])
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
        <h2>id:{{editing.id}}</h2>
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
            <div v-if="linesInPt.length!=0">
                <h2>拆分线路</h2>
                <div class="optionSection">
                    <table class="fullWidth" v-if="editing.nameP"><tbody>
                        <tr>
                            <td>可拆：</td>
                            <td>
                            <div v-for="Rl in linesInPt.filter(lineinpt=>envStore.hasNoDuplicateNumbers(lineinpt.pts)
                                &&!isTerminal(lineinpt))">
                                <button 
                                :style="{'backgroundColor':Rl.color,'color':Rl.tagTextColor ?? colorProcStore.colorProcInvBinary.convert(Rl.color)}"
                                @click=splitLineByPtF(Rl.id,editing.id)
                                >
                                {{ Rl.name }}
                                </button>
                            </div>
                            </td>
                        </tr>
                    </tbody></table>
                    <div class="smallNote" style="text-align: center;">
                    目前只有“简单线路”（即不经过任何一个站超过一次）的非端点可以拆分
                    <br>
                    如果你的简单线路不显示拆分按钮<br>可能是由于古老的bug（现在已经被修复，但是老存档没有被改正）
                    <br>
                    请去 设置-杂项-修复线路上相邻两点重复问题
                </div>
                </div>
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