<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useApiStore } from '@/app/com/apiStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useIdentitiesRoutesJump } from './routes/routesJump';
import Notice from '@/components/common/Notice.vue';

const userName = ref<string>("");
const password = ref<string>("");
const passwordRepeat = ref<string>("");
const { loginRouteJump } = useIdentitiesRoutesJump()
const noticeRead = ref(false)

async function register(){
    if(!userName.value){
        pop?.show("用户名不能为空","failed")
        return
    }
    if(!password.value || password.value.length <= 6){
        pop?.show("密码过短", "failed")
        return
    }
    if(password.value != passwordRepeat.value){
        pop?.show("前后两次输入密码不一致", "failed")
        return
    }
    const res = await api.user.add(userName.value, password.value)
    if(res){
        pop?.show("注册成功", "success")
        loginRouteJump(false)
    }
}

const api = useApiStore()
const { pop } = useUniqueComponentsStore()
const contact = import.meta.env.VITE_GuideMemberApply
onMounted(async()=>{
})
</script>

<template>
    <div>
        <h1>注册</h1>
    </div>
    <div>
        <Notice v-if="!noticeRead" :title="'注册须知'" :type="'info'">
            <p><b>为了确保内容合规性，新账号为“游客”账号</b></p>
            <p>“游客”不会显示在用户列表中，“游客”的作品也无法公开展示，
            如果想要公开展示作品，需要由管理员将账号转为“会员”（转正）</p>
            <ol>
                <li>管理员可以在首页看到“游客”的最新作品，如果管理员认为作品质量高，就会为账号转正</li>
                <li>{{ contact || '暂不接收主动申请转正' }}</li>
            </ol>
            <button @click="noticeRead=true" style="display: block; margin: 6px auto;">
                我知道了
            </button>
        </Notice>
        <table v-else><tbody>
            <tr>
                <td>昵称</td>
                <td>
                    <input v-model="userName" type="text"/>
                </td>
            </tr>
            <tr>
                <td>密码</td>
                <td>
                    <input v-model="password" type="password" autocomplete="new-password"/>
                </td>
            </tr>
            <tr>
                <td>重复密码</td>
                <td>
                    <input v-model="passwordRepeat" type="password" autocomplete="new-password"/>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <button @click="register" style="margin: 0px auto">注&nbsp;册</button>
                </td>
            </tr>
        </tbody></table>
    </div>
</template>

<style scoped lang="scss">
p{
    margin: 4px 0px;
}
ol{
    margin: 8px 0px 0px 0px;
    li{
        margin: 4px 0px 0px 15px;
    }
}
table{
    margin:auto;
    background-color: transparent;
    font-size: large;
    color:gray
}
td{
    background-color: transparent;
}
input{
    background-color: #eee;
}
.notice{
    margin-top: 50px;
    a{
        text-decoration: underline;
        font-weight: bold;
        color: white;
    }
}
</style>