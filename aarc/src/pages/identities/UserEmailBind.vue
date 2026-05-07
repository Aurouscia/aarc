<script setup lang="ts">
import { useApiStore } from '@/app/com/apiStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import Notice from '@/components/common/Notice.vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const api = useApiStore()
const { showPop } = useUniqueComponentsStore()
const route = useRoute()

const isChange = computed<boolean>(() => route.query.isChange === '1')

const email = ref<string>("");
const code = ref<string>("");
const countdown = ref<number>(0);
let timer: ReturnType<typeof setInterval> | null = null;

const storageKey = 'aarc-emailCodeCountdown';

const emailValid = computed<boolean>(() => email.value.includes('@'));

function getRemainingFromStorage(): number {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return 0;
    const target = parseInt(raw, 10);
    if (isNaN(target)) return 0;
    const remaining = Math.ceil((target - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
}

function startCountdown(seconds: number) {
    countdown.value = seconds;
    const target = Date.now() + seconds * 1000;
    localStorage.setItem(storageKey, target.toString());
    timer = setInterval(() => {
        const remaining = getRemainingFromStorage();
        countdown.value = remaining;
        if (remaining <= 0) {
            clearInterval(timer!);
            timer = null;
            localStorage.removeItem(storageKey);
        }
    }, 1000);
}

async function requestCode() {
    if (countdown.value > 0) return;
    if (!email.value) {
        showPop('请输入邮箱地址', 'warning');
        return;
    }
    if (!emailValid.value) {
        showPop('邮箱格式不正确', 'warning');
        return;
    }
    const res = await api.user.requestBindEmail(email.value)
    if (res) {
        showPop('已发送', 'success')
        startCountdown(60);
    }
}

async function confirmBind() {
    if (!email.value) {
        showPop('请输入邮箱地址', 'warning');
        return;
    }
    if (!code.value) {
        showPop('请输入验证码', 'warning');
        return;
    }
    const res = await api.user.confirmBindEmail(code.value, email.value)
    if (res) {
        showPop('绑定成功', 'success')
    }
}

onMounted(() => {
    const remaining = getRemainingFromStorage();
    if (remaining > 0) {
        startCountdown(remaining);
    }
});

onUnmounted(() => {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
});
</script>

<template>
    <div class="container">
        <h1>绑定邮箱</h1>
        <Notice v-if="isChange" :type="'warn'">
            如果已经绑定邮箱，获取验证码将导致解绑
        </Notice>
        <div class="form">
            <div class="row">
                <input v-model="email" type="email" placeholder="请输入邮箱地址" />
                <button
                    @click="requestCode"
                    class="code-btn"
                    :disabled="countdown > 0"
                >
                    {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
                </button>
            </div>
            <div class="row">
                <input
                    v-model="code"
                    type="text"
                    placeholder="请输入验证码"
                    :disabled="!emailValid"
                />
                <button @click="confirmBind" class="bind-btn">确认绑定</button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.container {
    max-width: 400px;
    margin: 0 auto;
    padding: 0px;
}
h1 {
    text-align: center;
    margin-bottom: 20px;
}
.form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 20px;
}
.row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
}
input {
    flex: 1;
    border: 1px solid #ddd;
    border-radius: 4px;
}
input:disabled {
    background-color: #e0e0e0;
    cursor: not-allowed;
}
.code-btn,
.bind-btn {
    cursor: pointer;
    white-space: nowrap;
}
.code-btn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}
</style>
