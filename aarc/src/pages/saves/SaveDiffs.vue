<script setup lang="ts">
import { SaveDiffDto } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { computed, onMounted, ref } from 'vue';
import { decompressFromBase64 } from 'lz-string'
import { useRoute } from 'vue-router';
import { JsonViewer } from '@anilkumarthakur/vue3-json-viewer';

const route = useRoute()
const api = useApiStore()
const { showPop } = useUniqueComponentsStore()
const saveIdNum = computed(()=>parseInt(route.query['saveId']?.toString() ?? '0'))
const userIdNum = computed(()=>parseInt(route.query['userId']?.toString() ?? '0'))

type SaveDtoShow = SaveDiffDto & {show?:boolean, obj?:any}
type SaveDtoShowRow = SaveDtoShow | {id:number, obj?:any, isObjRow:true}

const diffs = ref<Array<SaveDtoShow>>([])
const noMore = ref(false)
const zero = computed(()=>noMore.value && diffs.value.length==0)
let loading = false
const takeCount = 10
async function load(init:boolean) {
    if(loading) return
    loading = true
    const res = await api.save.getDiffs(saveIdNum.value, userIdNum.value, diffs.value.length, takeCount)
    if(res){
        diffs.value.push(...res)
        if(res.length == 0){
            if(!init)
                showPop('没有更多了', 'warning')
            noMore.value = true
        }
        else if(res.length < takeCount){
            noMore.value = true
        }
    }
    loading = false
}

const rows = computed<Array<SaveDtoShowRow>>(()=>{
    const rows:Array<SaveDtoShowRow> = []
    for(const d of diffs.value){
        d.id ??= Math.random()
        rows.push(d)
        if(d.show){
            d.obj ??= dataDisplay(d.lzJsonDataBase64)
            rows.push({id: -d.id, obj: d.obj, isObjRow: true})
        }
    }
    return rows
})

function dataDisplay(lzJsonBase64?:string){
    if(!lzJsonBase64)
        return {error:'缺少值'}
    const json = decompressFromBase64(lzJsonBase64)
    let res:any
    try{
        res = JSON.parse(json)
    }
    catch{
        res = {error:'解析异常'}
    }
    return res
}

onMounted(async()=>{
    await load(true)
})
</script>

<template>
<h1>访客编辑记录</h1>
<div class="smallNote diff-usage">
    {{ zero ? '暂无访客编辑记录（自己的编辑不会有记录）' : '注：您无需看懂这里的数据，仅需在存档遭到恶意破坏时，将本页面链接发给管理员即可。' }}
</div>
<div v-if="!zero" class="wideTableContainer">
    <table class="fullWidth"><tbody>
        <tr>
            <th style="width: 90px;">时间</th>
            <th style="width: 120px;">用户</th>
            <th style="min-width: 50px;"></th>
        </tr>
        <tr v-for="r in rows" :key="r.id">
            <td colspan="3" v-if="'isObjRow' in r">
                <JsonViewer :data="r.obj" :dark-mode="true"/>
            </td>
            <template v-else>
                <td class="diff-time">{{ r.time }}</td>
                <td>{{ r.userName }}</td>
                <td class="toggle-td" @click="r.show=!r.show">
                    <div>{{ r.length }}</div>
                    <button class="lite">{{ r.show ? '点击收起' : '点击展开' }}</button>
                </td>
            </template>
        </tr>
        <tr v-if="!noMore">
            <td colspan="3">
                <button class="minor" @click="load(false)">加载更多</button>
            </td>
        </tr>
    </tbody></table>
</div>
</template>

<style lang="scss" scoped>
.diff-usage{
    margin: 10px 0px;
    padding: 10px;
    background-color: #f7f7f7;
}
.diff-time{
    font-size: 14px;
}
.toggle-td{
    &:hover{
        cursor: pointer;
        background-color: #ddd;
        button{
            text-decoration: underline;
        }
    }
}
td{
    &:deep(button){
        margin-top: 0px;
        margin-bottom: 0px;
    }
    &:deep(.jv-children){
        margin-left: 0px;
        padding-left: 24px;
    }
    &:deep(.jv-root-controls){
        display: none;
    }
    @media screen and (max-width: 800px) {
        :deep(.jv-children){
            padding-left: 12px;
        }
    }
}
</style>