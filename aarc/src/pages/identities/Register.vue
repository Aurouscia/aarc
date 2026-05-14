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

const noticeRead = ref(false)
const waitLong = ref(false)
const noticeCountdown = ref(5)
let noticeCountdownTimer: number | undefined
function startNoticeCountdown(){
    noticeCountdown.value = 6
    noticeCountdownTimer = window.setInterval(()=>{
        noticeCountdown.value--
        if(noticeCountdown.value <= 0){
            clearInterval(noticeCountdownTimer)
            noticeCountdownTimer = undefined
        }
    }, 1000)
}
function noticeKnown(){
    if(noticeCountdown.value > 0){
        return
    }
    noticeRead.value = true
    window.setTimeout(()=>{
        waitLong.value = true
    }, 8000)
}
onMounted(()=>{
    startNoticeCountdown()
})

onMounted(async()=>{
})
</script>

<template>
    <div>
        <h1>注册</h1>
    </div>
    <div>
        <Notice v-if="!noticeRead" :title="'注册须知'" :type="'info'">
            <p><b>1. 为了确保内容合规性，新账号为“游客”账号</b></p>
            <p>2. “游客”不会显示在用户列表中，“游客”的作品也无法公开展示，
            如果想要公开展示作品，需要成为“正式用户”（免费）</p>
            <p>3. “转正”操作入口位于<b>顶部栏-用户-个人信息设置</b></p>
            <button @click="noticeKnown" :class="{off: noticeCountdown > 0}" style="display: block; margin: 6px auto;">
                我知道了{{ noticeCountdown > 0 ? `（${noticeCountdown}）` : '' }}
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
    text-indent: 2em;
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