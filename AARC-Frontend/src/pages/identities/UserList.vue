<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { UserDto, UserType } from './models/models';
import { useApiStore } from '@/app/com/api';
import { userTypeReadable } from './models/utils';
import SideBar from '@/components/common/SideBar.vue';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { storeToRefs } from 'pinia';
import { useSavesRoutesJump } from '../saves/routes/routesJump';

const list = ref<UserDto[]>()
const api = useApiStore().get()
const { someonesSavesRoute } = useSavesRoutesJump()
async function loadList() {
    list.value = await api.user.index()
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
    await loadList()
})
</script>

<template>
<h1>用户列表</h1>
<div class="wideTableContainer">
<table class="fullWidth"><tbody>
    <tr>
        <th>名称</th>
        <th style="width: 100px;">类型</th>
        <th style="width: 130px;">操作</th>
    </tr>
    <tr v-for="u in list" :key="u.Id">
        <td>{{ u.Name }}</td>
        <td>{{ userTypeReadable(u.Type) }}</td>
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
    <tr v-if="list && list.length>=50">
        <td colspan="3">仅显示最新活动的50个用户</td>
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

</style>