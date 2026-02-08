<script setup lang="ts">
import { UserDto } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { onMounted, ref } from 'vue';
import UserSelect from '../components/UserSelect.vue';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useRouter } from 'vue-router';
import { loginName } from './routes/routesNames';

const api = useApiStore()
const userInfoStore = useUserInfoStore()
const { showPop } = useUniqueComponentsStore()

const showUserSelect = ref(false)
const user = ref<{id?:number, name?:string}>()
const userCurrentCredit = ref<number>()
async function loadUserCredit(){
    if(!user.value?.id) return
    userCurrentCredit.value = await api.user.getCredit(user.value.id)
}
function onSelectedUser(u?:UserDto){
    if(u){
        user.value = u
        loadUserCredit()
    }else{
        showUserSelect.value = false
    }
}

const changeDelta = ref<number>()
const changeComment = ref<string>()
async function makeChange(){
    if(!changeDelta.value){
        showPop('改变量不能为0', 'failed')
        return
    }
    if(!Number(changeDelta.value)){
        showPop('改变量必须为数字', 'failed')
        return
    }
    if(!changeComment.value?.trim()){
        showPop('必须填写原因', 'failed')
        return
    }
    const res = await api.user.changeCredit(user.value?.id, changeDelta.value, changeComment.value)
    if(res){
        showPop('修改成功', 'success')
        changeComment.value = undefined
        changeDelta.value = undefined
        await loadUserCredit()
    }
}

onMounted(()=>{
    if(!userInfoStore.isAdmin){
        user.value = {
            id: userInfoStore.userInfo.id,
            name: userInfoStore.userInfo.name
        }
        if(!user.value.id){
            showPop('请登录后查看', 'failed')
            useRouter().replace({name: loginName})
        }
        else{
            loadUserCredit()
        }
    }
})
</script>

<template>
<div class="user-credit">
    <template v-if="!user">
        <UserSelect v-if="showUserSelect" @select="onSelectedUser"></UserSelect>
        <button @click="showUserSelect=true">选择用户</button>
    </template>
    <template v-else>
        <b>{{ user.name }}</b>
        <div>信用分：{{ userCurrentCredit ?? '加载中' }}</div>
        <div v-if="userInfoStore.isAdmin" class="change-form">
            <input v-model.number="changeDelta" type="number" placeholder="改变量（负数表示扣分）"/>
            <input v-model="changeComment" placeholder="变动原因（必填）"/>
            <button @click="makeChange">保存</button>
            <button class="lite" @click="user=undefined;showUserSelect=true">切换其他用户</button>
            <div class="smallNote">注：该分数目前仅起一个标记作用，并不影响任何权限</div>
        </div>
        <div v-else class="smallNote">
            如有疑问请查看“系统操作记录”
        </div>
    </template>
</div>
</template>

<style lang="scss" scoped>
.user-credit, .change-form{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
}
.user-credit{
    height: 100%;
}
.change-form{
    gap: 4px;
    background-color: #eee;
    border-radius: 10px;
    padding: 10px;
    .lite{
        margin-top: 10px;
        font-size: 14px;
    }
}
</style>