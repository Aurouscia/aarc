<script setup lang="ts">
import { useApiStore } from '@/app/com/apiStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { useRouter } from 'vue-router';

const api = useApiStore()
const router = useRouter()
const { showPop } = useUniqueComponentsStore()

async function upgradeToMember() {
    const res = await api.user.upgradeToMember()
    if(res){
        await useUserInfoStore().getIdentityInfo(true)
        showPop('已成功转正', 'success')
        window.setTimeout(()=>{
            router.push('/')
        }, 500)
    }
}

const help = import.meta.env.VITE_GuideFindHelp
</script>

<template>
    <div class="container">
        <h1>转为正式用户</h1>
        <div class="rules">
            <div class="rule">免费转为正式用户后，您可以公开展示作品到首页、与他人协作（创建公共画布），要求如下：</div>
            <div class="rule">1. 当前是游客身份（注册后初始为游客）</div>
            <div class="rule">2. 已绑定邮箱（可以在<b>顶部栏-用户-个人信息设置</b>进行绑定）</div>
            <div class="rule">3. 此前无类型变动记录（没有被封过号）</div>
            <div class="rule">如果无法接收到邮件，或遇到其他问题：{{ help }}</div>
        </div>
        <button
            class="upgrade-btn"
            @click="upgradeToMember"
        >
            转为正式用户
        </button>
    </div>
</template>

<style scoped lang="scss">
.container {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    text-align: center;
    margin-bottom: 30px;
}

.rules {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 30px;
}

.rule {
    padding: 8px 12px;
    border-radius: 8px;
    background-color: #f7f7f7;
    border: 1px solid #e0e0e0;
}

.upgrade-btn {
    width: 100%;
    font-size: 16px;
    cursor: pointer;
    border-radius: 8px;
    border: none;
    background-color: #4caf50;
    color: white;
    transition: opacity 0.3s ease;

    &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
        opacity: 0.7;
    }
}
</style>
