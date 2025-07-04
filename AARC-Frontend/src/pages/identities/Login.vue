<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { guideInfo } from '@/app/guideInfo';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { useApiStore } from '@/app/com/apiStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { userTypeReadable } from './models/utils';
import { RouterLink } from 'vue-router';
import { useIdentitiesRoutesJump } from './routes/routesJump';
import { loginExpireHrsDefault, useAuthLocalConfigStore } from '@/app/localConfig/authLocalConfig';
import { useBrowserInfoStore } from '@/app/globalStores/browserInfo';

const props = defineProps<{
    backAfterSuccess?:string
}>();
const router = useRouter()
const configStore = useAuthLocalConfigStore()
const { loginExpireHrs } = storeToRefs(configStore)
const { isWebkit } = useBrowserInfoStore()

const userName = ref<string>("")
const password = ref<string>("")
const setExpire = ref<boolean>(false);
const failedGuide = ref<string>();
const userInfoStore = useUserInfoStore()
const { userInfo } = storeToRefs(userInfoStore)
const api = useApiStore()
const { pop } = useUniqueComponentsStore()
const { registerRoute } = useIdentitiesRoutesJump()

async function Login(){
    const loginResp = await api.auth.login(
        userName.value,
        password.value,
        Number(loginExpireHrs.value) || loginExpireHrsDefault
    )
    if (loginResp && loginResp.token) {
        pop?.show("登录成功", "success");
        api.setJwtToken(loginResp.token);
        userInfoStore.clearCache();
        await userInfoStore.getIdentityInfo(true);
        if (props.backAfterSuccess) {
            router.back()
        } else {
            router.push("/")
        }
    }else{
        const way = guideInfo.resetPassword || "请联系管理员重置"
        failedGuide.value = "如果忘记密码，" + way
    }
};
async function Logout() {
    api.clearJwtToken()
    userInfoStore.clearCache()
    pop?.show("已退出登录","success");
}

const leftTimeDisplay = computed<string>(()=>{
    if(!userInfo){
        return '0小时';
    }
    const hours = userInfo.value.leftHours ?? 0;
    if(hours>72){
        return Math.round(hours/24)+'天';
    }
    return hours+'小时';
})

onMounted(async()=>{
    configStore.backCompat()
    await userInfoStore.getIdentityInfo(true);
})
</script>

<template>
    <div>
        <h1>登录</h1>
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
        </tbody></table>
        <div class="login">
            <RouterLink class="register" :to="registerRoute()"><button class="minor">
               注册
            </button></RouterLink>
            <button @click="Login" class="confirm">登录</button>
        </div>
        <div class="needExpire">
            <div @click="setExpire=!setExpire" style="cursor: pointer;text-decoration: underline;">登录状态保持</div>
            <select v-show="setExpire" v-model="loginExpireHrs">
                <option :value="3">3小时</option>
                <option :value="24">24小时</option>
                <option :value="168">7天</option>
                <option :value="720">30天</option>
                <option :value="8760">365天</option>
            </select>
        </div>
        <div v-show="setExpire" style="color:red; text-align: center;">仅在自己的设备上选择较长时间</div>
        <div class="guide" style="color:red" v-if="failedGuide">{{ failedGuide }}</div>
        <div class="guide" style="font-size: 13px;" v-else>
            <div><b>本应用对系统版本/浏览器版本非常敏感</b></div>
            <div>如果遇到异常现象，请先</div>
            <!--苹果设备的浏览器内核是系统的一部分，应该提示检查系统版本-->
            <div v-if="isWebkit">在设置中确认设备<b>是否有苹果系统更新</b></div>
            <div v-if="isWebkit"><b>如果苹果设备较旧，即使系统最新也可能出问题</b></div>
            <!--其他设备提示检查浏览器版本-->
            <div v-else>确认浏览器<b>是否有版本更新</b></div>
            <div><b>不要</b>使用IE等已停止更新的旧型浏览器</div>
            <div><b>不要</b>使用过旧的、无法更新系统的设备</div>
            <div>否则程序将无法正常工作</div>
            <div>如果确认版本后问题仍存在，请向管理员报告</div>
        </div>
        <div style="height: 15vh;"></div>
    </div>
    <div class="loginInfo" v-if="userInfo">
        当前登录：
        [{{ userTypeReadable(userInfo.type??0) }}]{{ userInfo.name }}<br/>
        登录有效期：{{ leftTimeDisplay }}<br/>
        <button @click="Logout" class="logout">退出登录</button>
    </div>
</template>

<style scoped lang="scss">
.guide{
    margin: 10px;
    margin-top: 20px;
    text-align: center;
    border-radius: 5px;
    color: #999;
    div{
        margin-bottom: 6px;
    }
    b{
        color: plum;
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
.needExpire{
    text-align: center;
    height: 60px;
    margin-top: 20px;
    font-size: small;
    color: #999;
    display: flex;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
    flex-wrap: wrap;
}
.needExpire select{
    padding: 2px;
    margin: 2px;
    margin-left: 10px;
}
.login{
    display: flex;
    justify-content: center;
    gap: 20px
}
button.logout{
    background-color: gray;
    color:white;
    padding: 2px;
}
.footer{
    position: fixed;
    bottom: 0px;
    left: 0px;
    right: 0px;
}
.loginInfo{
    background-color: white;
    padding: 5px;
    color:gray;
    font-size:small;
    text-align: center;
    position: fixed;
    margin: 0px;
    left:10px;
    bottom: 10px;
    box-shadow: 0px 0px 8px 0px gray;
    border-radius: 5px;
}
</style>