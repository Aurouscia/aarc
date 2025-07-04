<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useApiStore } from '@/app/com/apiStore';
import { userTypeReadable } from './models/utils';
import SideBar from '@/components/common/SideBar.vue';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { storeToRefs } from 'pinia';
import { useSavesRoutesJump } from '../saves/routes/routesJump';
import { useUserListLocalConfigStore } from '@/app/localConfig/userListLocalConfig';
import { UserDto, UserType } from '@/app/com/apiGenerated';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { WithIntroShow } from '@/utils/type/WithIntroShow';
import { useIdentitiesRoutesJump } from './routes/routesJump';
import { useRouter } from 'vue-router';

const list = ref<WithIntroShow<UserDto>[]>()
const api = useApiStore()
const { someonesSavesRoute } = useSavesRoutesJump()
const { loginRouteJump, userListRoute } = useIdentitiesRoutesJump()
const configStore = useUserListLocalConfigStore()
const { orderby } = storeToRefs(configStore)
const orderbySave = computed(() => orderby.value === 'save')
const orderbyActive = computed(() => !orderby.value || orderby.value === 'active')
const router = useRouter()

const searchInit = router.currentRoute.value.query["search"] as string|undefined
const searchStr = ref<string|undefined>(searchInit)

async function loadList() {
    list.value = await api.user.index(searchStr.value, orderby.value)
    await router.replace(userListRoute(searchStr.value))
}

const { pop } = useUniqueComponentsStore()
const sidebar = ref<InstanceType<typeof SideBar>>()
const editingUser = ref<UserDto>()
const isCreatingUser = ref(false)
const userInfoStore = useUserInfoStore()
const { userInfo } = storeToRefs(userInfoStore)
let originalNameAndPwd = ''
function startEditing(u:UserDto){
    editingUser.value = u
    originalNameAndPwd = summerizeNameAndPwd()
    sidebar.value?.extend()
}
async function doneEditing(){
    if(!editingUser.value)
        return
    let success:boolean|undefined = false
    if(isCreatingUser.value){
        success = await api.user.add(editingUser.value.name || "", editingUser.value.password || "")
    }else{
        success = await api.user.update(editingUser.value)
    }
    if(success){
        pop?.show("操作成功", "success")
        let newNameAndPwd = summerizeNameAndPwd()
        if(newNameAndPwd !== originalNameAndPwd && userInfo.value?.id === editingUser.value.id){
            pop?.show("请立即重新登录", "warning")
            loginRouteJump()
        }else{
            await loadList()
            sidebar.value?.fold()
        }
    }
}
function summerizeNameAndPwd(){
    return JSON.stringify({
        name: editingUser.value?.name,
        password: editingUser.value?.password
    })
}

onMounted(async()=>{
    configStore.backCompat()
    orderby.value ??= 'active'
    await loadList()
})
</script>

<template>
<h1 class="h1WithBtns">
    用户列表
    <div class="searchControl">
        <div>
            <button v-show="searchStr" class="lite" @click="searchStr=undefined;loadList()">清空</button>
            <input v-model="searchStr" @blur="loadList" placeholder="搜索用户名称"/>
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
        <th class="userNameTh">名称</th>
        <th>
            简介<span class="introNote">点击展开</span>
        </th>
        <th v-if="orderbySave" style="width: 100px;">作品数</th>
        <th v-if="orderbyActive" style="width: 100px;">上次活跃</th>
        <th style="width: 110px;">操作</th>
    </tr>
    <tr v-for="u in list" :key="u.id">
        <td>
            <div class="userName nowrapEllipsis">
                <span v-if="u.id === userInfo.id" style="color: cornflowerblue">(我)</span>
                {{ u.name }}
            </div>
        </td>
        <td>
            <div class="itemIntro" :class="{nowrapEllipsis:!u.introShow}" @click="u.introShow=!u.introShow">
                {{ u.intro }}
            </div>
        </td>
        <td v-if="orderbySave">{{ u.saveCount }}</td>
        <td v-if="orderbyActive" class="lastActive">{{ u.lastActive }}</td>
        <td>
            <RouterLink :to="someonesSavesRoute(u.id??0)">
                <button class="lite" style="margin-right: 6px;">
                    查看
                </button>
            </RouterLink>
            <button @click="startEditing(u)" v-if="userInfo.id === u.id || userInfoStore.isAdmin" class="lite">
                编辑
            </button>
        </td>
    </tr>
    <tr>
        <td colspan="4" style="color: #666; font-size: 14px;">仅显示当前排序前50的用户</td>
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
                    <input v-model="editingUser.name"/>
                </td>
            </tr>
            <tr>
                <td>密码</td>
                <td>
                    <input v-model="editingUser.password" type="password" autocomplete="new-password"/>
                </td>
            </tr>
            <tr v-if="!isCreatingUser">
                <td>简介</td>
                <td>
                    <textarea v-model="editingUser.intro" placeholder="可提供自己的联系方式（不超过128个字符）"></textarea>
                </td>
            </tr>
            <tr v-if="!isCreatingUser && userInfoStore.isAdmin">
                <td>类型</td>
                <td>
                    <select v-model="editingUser.type">
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
        </tbody>
    </table>
</SideBar>
</template>

<style scoped lang="scss">
@use '@/styles/itemIntro.scss';

.lastActive{
    font-size: 14px;
}
.userNameTh{
    width: 190px;
}
.userName{
    margin: auto;
    max-width: 180px;
}
</style>