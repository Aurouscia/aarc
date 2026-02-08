<script setup lang="ts">
import { UserHistoryDto, UserHistoryType } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { useNameMapStore } from '@/app/globalStores/nameMap';
import { onMounted, ref } from 'vue';
import { userTypeReadable } from './models/utils';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';

const api = useApiStore()
const { showPop } = useUniqueComponentsStore()
const targetUserId = ref<number>()
const operatorUserId = ref<number>()
const type = ref<UserHistoryType>(UserHistoryType.Unknown)
const nameMap = useNameMapStore()

const list = ref<UserHistoryDto[]>([])
async function load(append?:'append') {
    if(!append){
        list.value = []
    }
    const res = await api.user.loadHistory(targetUserId.value, operatorUserId.value, type.value, list.value.length)
    if(res){
        const newUserIds0 = res.map(x => x.operatorUserId ?? 0)
        const newUserIds1 = res.map(x => x.targetUserId ?? 0)
        await nameMap.ensureLoaded('userNameMap', [...newUserIds0, ...newUserIds1])
        list.value.push(...res)
        if(!res.length && append){
            showPop('没有更多了', 'failed')
        }
    }
}

function typeStr(type?:UserHistoryType){
    if(type == UserHistoryType.Register)
        return '注册'
    if(type == UserHistoryType.Login)
        return '登录'
    if(type == UserHistoryType.ChangeType)
        return '更改类型'
    if(type == UserHistoryType.ChangeNameOrPassword)
        return '重命名或改密码'
    if(type == UserHistoryType.ChangeCredit)
        return '修改信用分'
}
function detail(uh:UserHistoryDto){
    if(uh.userHistoryType == UserHistoryType.ChangeType)
        return userTypeReadable(uh.userTypeNew)
    if(uh.userHistoryType == UserHistoryType.ChangeCredit)
        return uh.userCreditDelta
}

onMounted(()=>{
    load()
})
</script>

<template>
<h1>系统操作记录</h1>
<div class="wideTableContainer">
<table class="index" style="min-width: 100%;"><tbody>
    <tr>
        <th style="min-width: 90px;">时间</th>
        <th style="min-width: 100px;">操作者</th>
        <th style="min-width: 100px;">被操作者</th>
        <th style="min-width: 130px;">类型</th>
        <th style="min-width: 100px;">详情</th>
    </tr>
    <tr v-for="h in list" :key="h.id">
        <td class="time">
            {{ h.timeStr }}
        </td>
        <td>
            {{ nameMap.userNameMap.get(h.operatorUserId ?? 0) ?? '---' }}
        </td>
        <td>
            {{ nameMap.userNameMap.get(h.targetUserId ?? 0) ?? '---' }}
        </td>
        <td>
            {{ typeStr(h.userHistoryType) }}
        </td>
        <td>
            {{ detail(h) }}
            <div v-if="h.comment" class="smallNote">{{ h.comment }}</div>
        </td>
    </tr>
</tbody></table>
</div>
<button class="minor loadMore" @click="load('append')">加载更多</button>
</template>

<style scoped lang="scss">
.time{
    font-size: 14px;
}
.loadMore{
    display: block;
    margin: 10px auto;
}
</style>