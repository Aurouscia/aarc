<script setup lang="ts">
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import SideBar from '@/components/common/SideBar.vue';
import { Line } from '@/models/save';
import { fromYMD, toYMD } from '@/utils/timeUtils/timeStr';
import { ref, useTemplateRef, watch } from 'vue';

const sidebar = useTemplateRef('sidebar')
defineExpose({
    open: ()=>{sidebar.value?.extend()}, 
    fold: ()=>{sidebar.value?.fold()}
})
const { showPop } = useUniqueComponentsStore()
const props = defineProps<{
    line: Line
}>()

const translated = ref<{
    open?: string
}>()

function syncFrom(){
    props.line.time ??= {}
    const t = props.line.time
    translated.value = {
        open: toYMD(t.open)
    }
}

function syncTo(prop: 'open'){
    props.line.time ??= {}
    const t = props.line.time
    if(prop == 'open')
        t.open = fromYMD(translated.value?.open, x=>showPop(x, 'failed'))
    console.log(props.line.time)
}

watch(()=>props.line, ()=>{
    syncFrom()
}, {
    immediate: true
})
</script>

<template>
<SideBar ref="sidebar">
<h1>时间轴（乞丐版）</h1>
<table v-if="translated"><tbody>
    <tr>
        <td>规划</td>
        <td><input disabled value="后续添加"/></td>
    </tr>
    <tr>
        <td>开工</td>
        <td><input disabled value="后续添加"/></td>
    </tr>
    <tr>
        <th>建成</th>
        <td>
            <input v-model="translated.open" placeholder="YYYY-MM-DD" @blur="syncTo('open')"/>
        </td>
    </tr>
    <tr>
        <td>停运</td>
        <td><input disabled value="后续添加" style="opacity: 0;"/></td>
    </tr>
    <tr>
        <td>废弃</td>
        <td><input disabled value="后续添加"/></td>
    </tr>
    <tr>
        <td colspan="2" class="smallNote" style="text-align: left;">
            时间可填写：2015（仅年份）<br/>
            或：2015-3（年-月）<br/>
            或：2015-3-15（年-月-日）
        </td>
    </tr>
    <tr>
        <td colspan="2" class="smallNote">
            为了更好收集使用需求<br/>
            先推出功能有限的初步版本，敬请谅解
        </td>
    </tr>
</tbody></table>
</SideBar>
</template>

<style lang="scss" scoped>

</style>