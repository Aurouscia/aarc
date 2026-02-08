<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useApiStore } from '@/app/com/apiStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useIdentitiesRoutesJump } from './routes/routesJump';
import Notice from '@/components/common/Notice.vue';
import Turnstile from '@/components/common/Turnstile.vue';

const userName = ref<string>("");
const password = ref<string>("");
const passwordRepeat = ref<string>("");
const turnstileToken = ref<string>();
const { loginRouteJump } = useIdentitiesRoutesJump()

const turnstileConfigured = !! import.meta.env.VITE_TurnstileSiteKey
const turnstileHidden = ref<boolean>(false)
function handleTurnstileVerify(token:string){
    turnstileToken.value = token;
    window.setTimeout(()=>{
        turnstileHidden.value = true
    }, 1000)
}

async function register(){
    if(!buttonAllowClick.value){
        return
    }
    if(!password.value || password.value.length <= 6){
        showPop("密码过短", "failed")
        return
    }
    if(password.value != passwordRepeat.value){
        showPop("前后两次输入密码不一致", "failed")
        return
    }
    const res = await api.user.add(userName.value, password.value, turnstileToken.value)
    if(res){
        showPop("注册成功", "success")
        loginRouteJump(false)
    }else{
        turnstileToken.value = "";
        turnstileHidden.value = false // 需要重新验证
    }
}
const buttonAllowClick = computed(()=>{
    // 如果没有配置turnstile，就不验证；否则，token有值才能点击注册
    return userName.value && password.value && passwordRepeat.value &&
        (turnstileConfigured ? turnstileToken.value : true)
})

const api = useApiStore()
const { showPop } = useUniqueComponentsStore()
const contact = import.meta.env.VITE_GuideMemberApply

const noticeRead = ref(false)
const waitLong = ref(false)
function noticeKnown(){
    noticeRead.value = true
    window.setTimeout(()=>{
        waitLong.value = true
    }, 8000)
}

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
            如果想要公开展示作品，需要由管理员将账号转为“正式用户”（转正）</p>
            <ol>
                <li>{{ contact || '暂不接收主动申请转正' }}</li>
            </ol>
            <button @click="noticeKnown" style="display: block; margin: 6px auto;">
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
                <td>重复<br/>密码</td>
                <td>
                    <input v-model="passwordRepeat" type="password" autocomplete="new-password"/>
                </td>
            </tr>
            <tr v-if="turnstileConfigured && !turnstileHidden">
                <td colspan="2">
                    <Turnstile @verify="handleTurnstileVerify"/>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <button @click="register" :class="{off: !buttonAllowClick}" style="margin: 0px auto">
                        注&nbsp;册
                    </button>
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
.smallNote{
    text-align: center;
    margin-top: 12px;
}
</style>