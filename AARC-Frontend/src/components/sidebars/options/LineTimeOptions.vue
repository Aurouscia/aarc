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