<script setup lang="ts">
import { UserDto, UserHistoryDto, UserHistoryType } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { useNameMapStore } from '@/app/globalStores/nameMap';
import { onMounted, ref, watch } from 'vue';
import { userTypeReadable } from './models/utils';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import UserSelect from '../components/UserSelect.vue';

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

const types = ref([
    UserHistoryType.Unknown, UserHistoryType.Register, UserHistoryType.Login, UserHistoryType.ChangeType,
    UserHistoryType.ChangeNameOrPassword, UserHistoryType.ChangeCredit
])
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
    if(type == UserHistoryType.Unknown)
        return '全部类型'
}
function detail(uh:UserHistoryDto){
    if(uh.userHistoryType == UserHistoryType.ChangeType)
        return userTypeReadable(uh.userTypeNew)
    if(uh.userHistoryType == UserHistoryType.ChangeCredit)
        return uh.userCreditDelta
}

const showOpSelect = ref(false)
const showTarSelect = ref(false)
function userSelected(forParam:'op'|'tar', u?:UserDto){
    showOpSelect.value = false
    showTarSelect.value = false
    if(!u) return
    nameMap.appendToMap('userNameMap', u.id ?? -1, u.name ?? '---')
    if(forParam=='op'){
        operatorUserId.value = u.id
    }
    else{
        targetUserId.value = u.id
    }
}

watch(()=>[targetUserId.value, operatorUserId.value, type.value], ()=>{
    load()
})

onMounted(()=>{
    load()
})
</script>

<template>
<h1>系统操作记录</h1>
<div class="conditions">
    <button v-if="operatorUserId" class="off" @click="operatorUserId = 0">
        筛选操作者：{{ nameMap.userNameMap.get(operatorUserId) }}
    </button>
    <button v-else @click="showOpSelect=true">筛选操作者</button>
    <button v-if="targetUserId" class="off" @click="targetUserId = 0">
        筛选目标：{{ nameMap.userNameMap.get(targetUserId) }}
    </button>
    <button v-else @click="showTarSelect=true">筛选目标</button>
    <button v-if="type" class="off" @click="type = 0">
        筛选类型：{{ typeStr(type) }}
    </button>
    <select v-else v-model.number="type">
        <option v-for="t in types" :value="t">{{ typeStr(t) }}</option>
    </select>
</div>
<UserSelect v-if="showOpSelect" @select="u=>userSelected('op', u)"></UserSelect>
<UserSelect v-if="showTarSelect" @select="u=>userSelected('tar', u)"></UserSelect>
<div class="wideTableContainer">
<table class="index" style="min-width: 100%;"><tbody>
    <tr>
        <th style="min-width: 90px;">时间</th>
        <th style="min-width: 100px;">操作者</th>
        <th style="min-width: 100px;">目标</th>
        <th style="min-width: 130px;">类型</th>
        <th style="min-width: 100px;">详情</th>
    </tr>
    <tr v-for="h in list" :key="h.id">
        <td class="time">
            {{ h.timeStr }}
        </td>
        <td>
            <button @click="operatorUserId = h.operatorUserId" class="lite">
                {{ nameMap.userNameMap.get(h.operatorUserId ?? 0) ?? '---' }}
            </button>
        </td>
        <td>
            <button @click="targetUserId = h.targetUserId" class="lite">
                {{ nameMap.userNameMap.get(h.targetUserId ?? 0) ?? '---' }}
            </button>
        </td>
        <td>
            <button @click="type = h.userHistoryType ?? 0" class="lite">
                {{ typeStr(h.userHistoryType) }}
            </button>
        </td>
        <td>
            {{ detail(h) }}
            <div v-if="h.comment" class="smallNote">{{ h.comment }}</div>
        </td>
    </tr>
</tbody></table>
</div>
<button v-if="list.length > 0" class="minor loadMore" @click="load('append')">加载更多</button>
<div v-else class="smallNote loadMore">暂无相关记录（可点击筛选条件移除）</div>
</template>

<style scoped lang="scss">
.time{
    font-size: 14px;
}
.loadMore{
    display: block;
    margin: 10px auto;
    text-align: center;
}
</style>