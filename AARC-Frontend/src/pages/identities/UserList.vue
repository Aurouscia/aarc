<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { UserDto, UserType } from './models/models';
import { useApiStore } from '@/app/com/api';
import { userTypeReadable } from './models/utils';
import SideBar from '@/components/common/SideBar.vue';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { storeToRefs } from 'pinia';
import { useSavesRoutesJump } from '../saves/routes/routesJump';
import { UserListOrderBy, useUserListLocalConfigStore } from '@/app/localConfig/userListLocalConfig';

const list = ref<UserDto[]>()
const api = useApiStore().get()
const { someonesSavesRoute } = useSavesRoutesJump()
const { readOrderby, saveOrderby, defaultOrderby } = useUserListLocalConfigStore()
const searchStr = ref<string>()
const orderby = ref<UserListOrderBy>(defaultOrderby)
const orderbySave = computed(() => orderby.value === 'save')
const orderbyActive = computed(() => !orderby.value || orderby.value === 'active')
async function loadList() {
    saveOrderby(orderby.value)
    list.value = await api.user.index(searchStr.value, orderby.value)
}

const sidebar = ref<InstanceType<typeof SideBar>>()
const editingUser = ref<UserDto>()
const isCreatingUser = ref(false)
const userInfoStore = useUserInfoStore()
const { userInfo } = storeToRefs(userInfoStore)
function startEditing(u:UserDto){
    editingUser.value = u
    sidebar.value?.extend()
}
async function doneEditing(){
    if(!editingUser.value)
        return
    let success = false
    if(isCreatingUser.value){
        success = await api.user.add(editingUser.value.Name || "", editingUser.value.Password || "")
    }else{
        success = await api.user.update(editingUser.value)
    }
    if(success){
        await loadList()
        sidebar.value?.fold()
    }
}

onMounted(async()=>{
    orderby.value = readOrderby()
    await loadList()
})
</script>

<template>
<h1 class="h1WithBtns">
    用户列表
    <div style="flex-direction: column;align-items: flex-end;">
        <div>
            <button v-show="searchStr" class="lite" @click="searchStr=undefined;loadList()">清空搜索</button>
            <input v-model="searchStr" @blur="loadList" placeholder="搜索用户名称" style="width: 120px;"/>
        </div>
        <select v-model="orderby" @change="loadList">
            <option :value="'active'">最新活跃</option>
            <option :value="'save'">最多作品</option>
        </select>
    </div>
</h1>
<div class="wideTableContainer">
<table class="fullWidth index"><tbody>
    <tr>
        <th>名称</th>
        <th v-if="orderbySave" style="width: 100px;">作品数</th>
        <th v-if="orderbyActive" style="width: 100px;">上次活跃</th>
        <th style="width: 130px;">操作</th>
    </tr>
    <tr v-for="u in list" :key="u.Id">
        <td>
            {{ u.Name }}
            <span v-if="u.Id === userInfo.Id" style="color: cornflowerblue">(我)</span>
        </td>
        <td v-if="orderbySave">{{ u.SaveCount }}</td>
        <td v-if="orderbyActive" class="lastActive">{{ u.LastActive }}</td>
        <td>
            <RouterLink :to="someonesSavesRoute(u.Id)">
                <button class="lite" style="margin-right: 6px;">
                    查看
                </button>
            </RouterLink>
            <button @click="startEditing(u)" v-if="userInfo.Id === u.Id || userInfoStore.isAdmin" class="lite">
                编辑
            </button>
        </td>
    </tr>
    <tr>
        <td colspan="3" style="color: #666; font-size: 14px;">仅显示当前排序前50的用户</td>
    </tr>
</tbody></table>
</div>
<SideBar ref="sidebar">
    <h1>编辑信息</h1>
    <table v-if="editingUser" class="fullWidth">
        <tbody>
            <tr>
                <td>名称</td>
                <td>
                    <input v-model="editingUser.Name"/>
                </td>
            </tr>
            <tr>
                <td>密码</td>
                <td>
                    <input v-model="editingUser.Password"/>
                </td>
            </tr>
            <tr v-if="!isCreatingUser">
                <td>简介</td>
                <td>
                    <textarea v-model="editingUser.Intro"></textarea>
                </td>
            </tr>
            <tr v-if="!isCreatingUser && userInfoStore.isAdmin">
                <td>类型</td>
                <td>
                    <select v-model="editingUser.Type">
                        <option :value="UserType.Member">{{ userTypeReadable(UserType.Member) }}</option>
                        <option :value="UserType.Admin">{{ userTypeReadable(UserType.Admin) }}</option>
                        <option :value="UserType.Tourist">{{ userTypeReadable(UserType.Tourist) }}</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <button @click="doneEditing">OK</button>
                </td>
            </tr>
            <tr v-if="!isCreatingUser">
                <td colspan="2" class="mediumNoteVital">
                    更改名称/密码后立即重新登录一次<br/>
                    让浏览器记住新密码
                </td>
            </tr>
        </tbody>
    </table>
</SideBar>
</template>

<style scoped lang="scss">
.lastActive{
    font-size: 14px;
}
</style>