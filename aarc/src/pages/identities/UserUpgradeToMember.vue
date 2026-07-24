<script setup lang="ts">
import { useApiStore } from '@/app/com/apiStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { guideInfo } from '@/app/guideInfo';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import { computed } from 'vue';
import { forkAarcName } from '@/pages/etc/routes/routesNames';
import { userUpgradeToMemberName } from './routes/routesNames';

const api = useApiStore()
const router = useRouter()
const route = useRoute()
const { showPop } = useUniqueComponentsStore()

type Mode = 'choice' | 'friend' | 'public' | 'noNeed'
const mode = computed<Mode>(() => {
    const m = route.params.mode
    if (m === 'friend' || m === 'public' || m === 'noNeed')
        return m
    return 'choice'
})

function goToMode(target: Exclude<Mode, 'choice'>) {
    router.push({ name: userUpgradeToMemberName, params: { mode: target } })
}
function goToChoice() {
    router.push({ name: userUpgradeToMemberName })
}

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
</script>

<template>
    <div class="container">
        <h1>转为正式用户</h1>
        <button
            v-if="mode !== 'choice'"
            class="minor other-choices"
            @click="goToChoice"
        >
            其他协作方式
        </button>
        <div v-if="mode === 'choice'" class="choice">
            <h2 class="choice-title">你需要什么样的协作功能？</h2>
            <div class="choice-btns">
                <div class="choice-btn primary" @click="goToMode('friend')">
                    👥 我想和认识的朋友一起创作，我的朋友在本站已有正式用户账号
                </div>
                <div class="choice-btn" @click="goToMode('public')">
                    🏠 我想进入陌生人的“公共图”创作，或者自己创建“公共图”，以认识更多朋友
                </div>
                <RouterLink class="choice-btn-link" :to="{ name: forkAarcName }"><div class="choice-btn">
                    🏦 我想拥有自主可控、不受打扰的团队创作空间
                </div></RouterLink>
                <div class="choice-btn" @click="goToMode('noNeed')">
                    ⛔ 我只想自己创作
                </div>
            </div>
        </div>
        <template v-else-if="mode === 'friend'">
            <div class="rules">
                <div class="rule">
                    让已有正式用户账号的朋友在以下位置操作：<br/><br/>
                    <i>顶部栏-作品授权管理-作品编辑-新增授权设置-允许某用户-搜索你的昵称</i><br/><br/>
                    接下来你就可以搜索并收藏他的作品，进行共同创作😊
                </div>
            </div>
        </template>
        <template v-else-if="mode === 'noNeed'">
            <div class="rules">
                <div class="rule">
                    ✅ 直接继续使用本站即可，无需任何转正操作
                </div>
            </div>
        </template>
        <template v-else>
            <div class="rules">
                <div class="rule">免费转为正式用户后，您可以公开展示作品到首页、与他人协作（创建公共画布），要求如下：</div>
                <div class="rule">1. 当前是游客身份（注册后初始为游客）</div>
                <div class="rule">2. 已绑定邮箱（可以在<b>顶部栏-用户-个人信息设置</b>进行绑定）</div>
                <div class="rule">3. 此前无类型变动记录（没有被封过号）</div>
                <div class="rule">4. 拥有一个满足如下条件的存档：<br/>
                    　- 线路数不少于 5<br/>
                    　- 站点数不少于 40<br/>
                    　- 有至少 5 个自动备份<br/>
                    （正常情况下，上述条件很容易在使用几次后自然满足，无需特殊操作👍）
                </div>
                <div class="rule">
                    没有邮箱？请试试使用<a href="https://mail.qq.com">QQ邮箱</a>，每个QQ号自带QQ邮箱😀
                </div>
                <div class="rule" v-if="guideInfo.findHelp">如果无法接收到邮件，或遇到其他问题：{{ guideInfo.findHelp }}</div>
            </div>
            <button
                class="upgrade-btn"
                @click="upgradeToMember"
            >
                点击此处转为正式用户
            </button>
        </template>
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
    margin-bottom: 20px;
}

.choice-title {
    text-align: center;
    margin-bottom: 20px;
    font-size: 18px;
    font-weight: normal;
}

.other-choices{
    display: block;
    margin: 0px auto 10px auto
}

.choice-btns {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.choice-btn-link {
    text-decoration: none;
    display: block;
    color: unset
}

.choice-btn {
    flex: 1;
    padding: 16px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    text-align: left;
    cursor: pointer;
    background-color: #fafafa;
    transition: all 0.2s ease;

    &:hover {
        border-color: #4caf50;
        background-color: #f0f9f0;
    }

    &.primary {
        border-color: #4caf50;
        background-color: #f0f9f0;

        &:hover {
            background-color: #e0f2e0;
        }
    }
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
    a {
        color: cornflowerblue;
        text-decoration: underline;
    }
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
