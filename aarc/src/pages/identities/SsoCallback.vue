<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiStore } from '@/app/com/apiStore';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';

const route = useRoute()
const router = useRouter()
const api = useApiStore()
const userInfoStore = useUserInfoStore()
const { showPop } = useUniqueComponentsStore()

const success = ref<boolean>(false)
const errmsg = ref<string>()
const processing = ref<boolean>(true)

onMounted(async () => {
    success.value = route.query.success === '1'
    errmsg.value = route.query.errmsg ? decodeURIComponent(route.query.errmsg as string) : undefined

    if (!success.value) {
        processing.value = false
        return
    }

    const loaded = api.setJwtTokenFromCookie('token')
    if (!loaded) {
        success.value = false
        errmsg.value = '登录成功但未找到令牌，请重试'
        processing.value = false
        return
    }

    userInfoStore.clearCache()
    await userInfoStore.getIdentityInfo(true)
    showPop('登录成功', 'success')
    processing.value = false
    router.push('/')
})
</script>

<template>
    <div class="ssoCallback">
        <h1>SSO 登录</h1>
        <div v-if="processing">正在处理登录结果，请稍候...</div>
        <div v-else-if="success" class="success">登录成功，正在跳转…</div>
        <div v-else class="failed">
            <div>登录失败</div>
            <div v-if="errmsg" class="errmsg">{{ errmsg }}</div>
            <button @click="router.push('/Login')">返回登录页</button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.ssoCallback{
    text-align: center;
    padding: 20px;
}
.success{
    color: olivedrab;
}
.failed{
    color: red;
}
.errmsg{
    margin: 10px 0;
    font-size: 14px;
    color: #666;
}
</style>
