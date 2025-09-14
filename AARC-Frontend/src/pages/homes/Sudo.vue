<script setup lang="ts">
import { useApiStore } from '@/app/com/apiStore';
import { ref } from 'vue';

const api = useApiStore()
const masterKey = ref<string>()
const mode = ref<keyof typeof api.sudo>()

const initAdminUserName = ref<string>()
const initAdminResMsg = ref<string>()
async function initAdmin() {
    initAdminResMsg.value = undefined
    initAdminResMsg.value = await api.sudo.initAdmin(initAdminUserName.value, masterKey.value)
}

const runBackupCleanupResMsg = ref<string>()
async function runBackupCleanup() {
    runBackupCleanupResMsg.value = undefined
    runBackupCleanupResMsg.value = await api.sudo.runBackupCleanup(masterKey.value)
}
</script>

<template>
<div style="padding: 20px;">
    <div class="modes">
        <button :class="mode=='initAdmin'?'confirm':'minor'"
            @click="mode='initAdmin';initAdminResMsg = undefined">
            初始化管理员账号
        </button>
        <button :class="mode=='runBackupCleanup'?'confirm':'minor'"
            @click="mode='runBackupCleanup';runBackupCleanupResMsg = undefined">
            运行备份清理
        </button>
    </div>
    <div class="inputs"> 
        <template v-if="mode=='initAdmin'">
            <input v-model="initAdminUserName" placeholder="账号用户名">
            <input v-model="masterKey" placeholder="masterKey">
            <button v-if="!initAdminResMsg" @click="initAdmin" class="ok">初始化账号</button>
            <div v-else>{{ initAdminResMsg }}</div>
        </template>
        <template v-if="mode=='runBackupCleanup'">
            <input v-model="masterKey" placeholder="masterKey">
            <button v-if="!runBackupCleanupResMsg" @click="runBackupCleanup" class="ok">运行</button>
            <div v-else>{{ runBackupCleanupResMsg }}</div>
        </template>
    </div>
</div>
</template>

<style lang="scss" scoped>
.modes{
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 10px;
    height: 50px;
    button{
        transition: 0s;
    }
}
.inputs{
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
}
</style>