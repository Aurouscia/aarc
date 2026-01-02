<script setup lang="ts">
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import SideBar from '@/components/common/SideBar.vue';
import { Line } from '@/models/save';
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
        open: translateFrom(t.open)
    }
}
function translateFrom(val?:number){
    if(!val) return ''
    const d = new Date(val)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const date = d.getDate()
    return `${year}-${month}-${date}`
}
function syncTo(prop: 'open'){
    props.line.time ??= {}
    const t = props.line.time
    if(prop == 'open')
        t.open = translateTo(translated.value?.open)
    console.log(props.line.time)
}
function translateTo(val?:string){
    if(!val) return undefined
    let [year, month, day] = val
        .split('-')
        .map(v => parseInt(v))
    month ??= 1
    day ??= 1
    if(isNaN(year) || isNaN(month) || isNaN(day)){
        showPop('时间格式异常', 'failed')
        return undefined
    }
    let date
    try{
        date = new Date(year, month-1, day)
        console.log(date)
    }
    catch(e){
        showPop('时间格式异常', 'failed')
        return undefined
    }
    return date.getTime()
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
        <td>建成</td>
        <td>
            <input v-model="translated.open" placeholder="YYYY-MM-DD" @blur="syncTo('open')"/>
        </td>
    </tr>
    <tr>
        <td colspan="2" class="smallNote" style="text-align: left;">
            可填写：2015（仅年份）<br/>
            或：2015-3（年-月）<br/>
            或：2015-3-15（年-月-日）
        </td>
    </tr>
</tbody></table>
</SideBar>
</template>

<style lang="scss" scoped>

</style>