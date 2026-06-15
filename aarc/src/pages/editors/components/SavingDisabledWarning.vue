<script setup lang="ts">
import { useSavesRoutesJump } from '@/pages/saves/routes/routesJump';
import { useIdentitiesRoutesJump } from '@/pages/identities/routes/routesJump';
import { useSavingDisabledWarningStore } from './savingDisabledWarningStore';
import { storeToRefs } from 'pinia';

const store = useSavingDisabledWarningStore()
const { warning, hide, notLogin, editingUserId } = storeToRefs(store)
const { dismiss } = store
const { someonesSavesRoute } = useSavesRoutesJump()
const { loginRoute } = useIdentitiesRoutesJump()
</script>

<template>
    <div v-if="warning" class="statusDisplay saving-disabled-warning" :class="{'warning-hidden': hide}">
        {{ warning }}
        <RouterLink v-if="notLogin" :to="loginRoute(true)">去登录</RouterLink>
        <RouterLink v-else-if="editingUserId" :to="someonesSavesRoute(editingUserId)">看看TA的作品</RouterLink>
        <button @click="dismiss">知道了</button>
    </div>
</template>

<style scoped lang="scss">
.saving-disabled-warning{
    color:white;
    animation: colorBlink 1s ease-out infinite;
    white-space: pre-wrap;
    line-height: 22px;
    a {
        margin-left: 16px;
        color: white;
        text-decoration: underline;
    }
    button {
        display: block;
        background-color: white;
        margin: 6px auto 3px;
        padding: 3px 20px;
        color: red;
        font-weight: bold;
    }
    &.warning-hidden {
        transform: translateY(140%);
        background-color: red;
        animation: none;
    }
}
@keyframes colorBlink {
    0% {
        background-color: red;
    }
    100% {
        background-color: orange;
    }
}
</style>
