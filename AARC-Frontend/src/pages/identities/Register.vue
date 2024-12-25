<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useApiStore } from '@/utils/app/com/api';
import { useUniqueComponentsStore } from '@/utils/app/globalStores/uniqueComponents';
import { useIdentitiesRoutesJump } from './routes/routesJump';

const userName = ref<string>("");
const password = ref<string>("");
const passwordRepeat = ref<string>("");
const { loginRouteJump } = useIdentitiesRoutesJump()

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
    const res = await api.get().user.add(userName.value, password.value)
    if(res){
        loginRouteJump(false)
    }
}

const api = useApiStore()
const { pop } = useUniqueComponentsStore()
onMounted(async()=>{
})
</script>

<template>
    <div>
        <h1>注册</h1>
    </div>
    <div>
        <table><tbody>
            <tr>
                <td>昵称</td>
                <td>
                    <input v-model="userName" type="text"/>
                </td>
            </tr>
            <tr>
                <td>密码</td>
                <td>
                    <input v-model="password" type="password"/>
                </td>
            </tr>
            <tr>
                <td>再次输入密码</td>
                <td>
                    <input v-model="passwordRepeat" type="password"/>
                </td>
            </tr>
        </tbody></table>
        <div class="reg">
            <button @click="register" class="confirm">注&nbsp;册</button>
        </div>
    </div>
</template>

<style scoped lang="scss">
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
.reg{
    display: flex;
    justify-content: center;
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