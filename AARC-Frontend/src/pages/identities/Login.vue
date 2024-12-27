<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { guideInfo } from '@/utils/app/guideInfo';
import { useUserInfoStore } from '@/utils/app/globalStores/userInfo';
import { useHttpClientStore } from '@/utils/app/com/httpClient';
import { useApiStore } from '@/utils/app/com/api';
import { useUniqueComponentsStore } from '@/utils/app/globalStores/uniqueComponents';
import { userTypeReadable } from './models/utils';
import { RouterLink } from 'vue-router';
import { useIdentitiesRoutesJump } from './routes/routesJump';
import { useAuthLocalConfigStore } from '@/utils/app/localConfig/authLocalConfig';

const props = defineProps<{
    backAfterSuccess?:string
}>();
const router = useRouter()
const { readLoginExpireHrs, saveLoginExpireHrs, loginExpireHrsDefault }
    = useAuthLocalConfigStore()

const userName = ref<string>("")
const password = ref<string>("")
const expireHrs = ref<number>(loginExpireHrsDefault);
const setExpire = ref<boolean>(false);
const failedGuide = ref<string>();
const userInfoStore = useUserInfoStore()
const { userInfo } = storeToRefs(userInfoStore)
const httpClient = useHttpClientStore().get()
const api = useApiStore().get()
const { pop } = useUniqueComponentsStore()
const { registerRoute } = useIdentitiesRoutesJump()

async function Login(){
    saveLoginExpireHrs(expireHrs.value);
    const loginResp = await api.auth.login(
        userName.value,
        password.value,
        expireHrs.value
    )
    if (loginResp) {
        httpClient.setToken(loginResp.Token);
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
    httpClient.clearToken()
    userInfoStore.clearCache()
    pop?.show("已经成功退出登录","success");
}

const leftTimeDisplay = computed<string>(()=>{
    if(!userInfo){
        return '0小时';
    }
    const hours = userInfo.value.LeftHours;
    if(hours>72){
        return Math.round(hours/24)+'天';
    }
    return hours+'小时';
})

onMounted(async()=>{
    expireHrs.value = readLoginExpireHrs()
    await userInfoStore.getIdentityInfo(true);
})
onUnmounted(()=>{
    //recoverTitle()
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
            <button @click="Login" class="confirm">登&nbsp;录</button>
        </div>
        <div class="needExpire">
            <div @click="setExpire=!setExpire" style="cursor: pointer;">登录状态保持</div>
            <select v-show="setExpire" v-model="expireHrs">
                <option :value="3">3小时</option>
                <option :value="24">24小时</option>
                <option :value="168">7天</option>
                <option :value="720">30天</option>
                <option :value="8760">365天</option>
            </select>
        </div>
        <div v-show="setExpire" style="color:red; text-align: center;">仅在自己的设备上选择较长时间</div>
        <RouterLink class="register" :to="registerRoute()">
            注册账号
        </RouterLink>
        <div class="guide" style="color:red" v-if="failedGuide">{{ failedGuide }}</div>
        <div class="guide" style="color:#aaa" v-else>请在较新设备上使用新版edge或chrome系浏览器以正常使用编辑功能</div>
    </div>
    <div class="loginInfo" v-if="userInfo">
        当前登录：
        [{{ userTypeReadable(userInfo.Type) }}]{{ userInfo.Name }}<br/>
        登录有效期：{{ leftTimeDisplay }}<br/>
        <button @click="Logout" class="logout">退出登录</button>
    </div>
    <!-- <div class="footer">
        <Footer></Footer>
    </div> -->
</template>

<style scoped lang="scss">
.guide{
    margin: 10px;
    text-align: center;
    border-radius: 5px;
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
    color:gray;
    font-size:small;
    text-align: center;
    position: fixed;
    margin: 0px;
    left:20px;
    bottom: 35px;
}
.register{
    display: block;
    text-align: center;
    color:gray;
    margin-top: 20px;
    font-size: 16px;
    text-decoration: underline;
    cursor: pointer;
}
</style>