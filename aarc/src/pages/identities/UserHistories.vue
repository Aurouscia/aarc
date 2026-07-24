<script setup lang="ts">
import { UserDto, UserHistoryDto, UserHistoryType, UserType } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { useNameMapStore } from '@/app/globalStores/nameMap';
import { computed, onMounted, ref, watch } from 'vue';
import { userTypeReadable } from './models/utils';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import UserSelect from '../components/UserSelect.vue';
import { useUserInfoStore } from '@/app/globalStores/userInfo';

const api = useApiStore()
const { showPop } = useUniqueComponentsStore()
const targetUserId = ref<number>()
const operatorUserId = ref<number>()

interface TypeFilter {
    type: UserHistoryType
    targetUserType?: UserType
}
const typeOptions: TypeFilter[] = [
    { type: UserHistoryType.Unknown },
    { type: UserHistoryType.Register },
    { type: UserHistoryType.Login },
    { type: UserHistoryType.ChangeType },
    { type: UserHistoryType.ChangeType, targetUserType: UserType.Tourist },
    { type: UserHistoryType.ChangeType, targetUserType: UserType.Member },
    { type: UserHistoryType.ChangeNameOrPassword },
    { type: UserHistoryType.ChangeCredit },
]
const selectedTypeIndex = ref(0)
const typeFilter = computed(() => typeOptions[selectedTypeIndex.value])

const comment = ref<string>()
const nameMap = useNameMapStore()
const userInfo = useUserInfoStore()

const list = ref<UserHistoryDto[]>([])
async function load(append?:'append') {
    if(!append){
        list.value = []
    }
    const res = await api.user.loadHistory(
        targetUserId.value, operatorUserId.value,
        typeFilter.value.type, comment.value, list.value.length,
        typeFilter.value.targetUserType)
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
    if(type == UserHistoryType.Unknown)
        return '全部类型'
}
function filterTypeStr(filter?:TypeFilter){
    if(!filter)
        return '---'
    if(filter.type == UserHistoryType.Register)
        return '注册'
    if(filter.type == UserHistoryType.Login)
        return '登录'
    if(filter.type == UserHistoryType.ChangeType){
        if(filter.targetUserType == UserType.Tourist)
            return '转为游客'
        if(filter.targetUserType == UserType.Member)
            return '转为正式'
        return '更改类型'
    }
    if(filter.type == UserHistoryType.ChangeNameOrPassword)
        return '重命名或改密码'
    if(filter.type == UserHistoryType.ChangeCredit)
        return '修改信用分'
    if(filter.type == UserHistoryType.Unknown)
        return '全部类型'
    return '---'
}
function setTypeFilterFromHistory(h:UserHistoryDto){
    const idx = typeOptions.findIndex(t =>
        t.type == (h.userHistoryType ?? UserHistoryType.Unknown)
        && t.targetUserType == h.userTypeNew)
    selectedTypeIndex.value = idx >= 0 ? idx : 0
}
const showCommentActionBtn = computed(() => {
    return typeFilter.value.type === UserHistoryType.ChangeType
        && (typeFilter.value.targetUserType === undefined || typeFilter.value.targetUserType === UserType.Member)
})
function onCommentAction(){
    comment.value = comment.value ? undefined : '!自助'
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

watch(()=>[targetUserId.value, operatorUserId.value, selectedTypeIndex.value, comment.value], ()=>{
    load()
})

onMounted(()=>{
    load()
})
</script>

<template>
<h1>系统操作记录<span class="small">（仅管理员和自己可见）</span></h1>
<div class="conditions">
    <template v-if="userInfo.isAdmin">
        <button v-if="operatorUserId" class="off" @click="operatorUserId = 0">
            筛选操作者：{{ nameMap.getName('userNameMap', operatorUserId) }}
        </button>
        <button v-else @click="showOpSelect=true">筛选操作者</button>
        <button v-if="targetUserId" class="off" @click="targetUserId = 0">
            筛选目标：{{ nameMap.getName('userNameMap', targetUserId) }}
        </button>
        <button v-else @click="showTarSelect=true">筛选目标</button>
    </template>
    <button v-if="typeFilter.type !== UserHistoryType.Unknown" class="off" @click="selectedTypeIndex = 0">
        筛选类型：{{ filterTypeStr(typeFilter) }}
    </button>
    <select v-else v-model.number="selectedTypeIndex">
        <option v-for="(t, i) in typeOptions" :value="i">{{ filterTypeStr(t) }}</option>
    </select>
    <input v-model.lazy.trim="comment" placeholder="筛选备注" style="vertical-align: middle;"/>
    <button v-if="showCommentActionBtn" class="minor" @click="onCommentAction">
        {{ comment ? '清空备注搜索' : '排除自助' }}
    </button>
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
                {{ nameMap.getName('userNameMap', h.operatorUserId ?? 0) ?? '---' }}
            </button>
        </td>
        <td>
            <button @click="targetUserId = h.targetUserId" class="lite">
                {{ nameMap.getName('userNameMap', h.targetUserId ?? 0) ?? '---' }}
            </button>
        </td>
        <td>
            <button @click="setTypeFilterFromHistory(h)" class="lite">
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
<div v-else class="smallNote loadMore">暂无相关记录</div>
<div class="smallNote loadMore" v-if="userInfo.isAdmin">提示：可点击激活的筛选条件移除</div>
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