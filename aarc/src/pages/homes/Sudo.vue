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

const initUsersCsv = ref<string>()
const initUsersResMsg = ref<string>()
async function initUsersFromCsv() {
    initUsersResMsg.value = undefined
    initUsersResMsg.value = await api.sudo.initUsersFromCsv(initUsersCsv.value, masterKey.value)
}

const runBackupCleanupResMsg = ref<string>()
async function runBackupCleanup() {
    runBackupCleanupResMsg.value = undefined
    runBackupCleanupResMsg.value = await api.sudo.runBackupCleanup(masterKey.value)
}

const migrateDbResMsg = ref<string>()
async function migrateDb() {
    migrateDbResMsg.value = undefined
    migrateDbResMsg.value = await api.sudo.migrateDb(masterKey.value)
}

const removeAllPublicSaveEditAuthGrantsMsg = ref<string>()
async function removeAllPublicSaveEditAuthGrants() {
    removeAllPublicSaveEditAuthGrantsMsg.value = undefined
    removeAllPublicSaveEditAuthGrantsMsg.value = await api.sudo.removeAllPublicSaveEditAuthGrants(masterKey.value)
}

const setUserAsAdminUserId = ref<number>()
const setUserAsAdminResMsg = ref<string>()
async function setUserAsAdmin() {
    setUserAsAdminResMsg.value = undefined
    setUserAsAdminResMsg.value = await api.sudo.setUserAsAdmin(setUserAsAdminUserId.value, masterKey.value)
}
</script>

<template>
<div style="padding: 20px;">
    <div class="modes">
        <button :class="mode=='initAdmin'?'confirm':'minor'"
            @click="mode='initAdmin';initAdminResMsg = undefined">
            初始化管理员账号
        </button>
        <button :class="mode=='initUsersFromCsv'?'confirm':'minor'"
            @click="mode='initUsersFromCsv';initUsersResMsg = undefined">
            批量初始化用户
        </button>
        <button :class="mode=='runBackupCleanup'?'confirm':'minor'"
            @click="mode='runBackupCleanup';runBackupCleanupResMsg = undefined">
            运行备份清理
        </button>
        <button :class="mode=='migrateDb'?'confirm':'minor'"
            @click="mode='migrateDb';migrateDbResMsg = undefined">
            更新数据库架构
        </button>
        <button :class="mode=='removeAllPublicSaveEditAuthGrants'?'confirm':'minor'"
            @click="mode='removeAllPublicSaveEditAuthGrants';removeAllPublicSaveEditAuthGrantsMsg = undefined">
            移除所有“允许所有人编辑”授权
        </button>
        <button :class="mode=='setUserAsAdmin'?'confirm':'minor'"
            @click="mode='setUserAsAdmin';setUserAsAdminResMsg = undefined">
            设置用户为管理员
        </button>
    </div>
    <div class="inputs"> 
        <template v-if="mode=='initAdmin'">
            <input v-model="initAdminUserName" placeholder="账号用户名">
            <input v-model="masterKey" placeholder="masterKey">
            <button v-if="!initAdminResMsg" @click="initAdmin" class="ok">初始化账号</button>
            <div v-else>{{ initAdminResMsg }}</div>
        </template>
        <template v-if="mode=='initUsersFromCsv'">
            <textarea v-model="initUsersCsv" placeholder="用户名,密码,UserType" rows="12" cols="60"></textarea>
            <input v-model="masterKey" placeholder="masterKey">
            <button v-if="!initUsersResMsg" @click="initUsersFromCsv" class="ok">批量初始化</button>
            <div v-else>{{ initUsersResMsg }}</div>
        </template>
        <template v-if="mode=='runBackupCleanup'">
            <input v-model="masterKey" placeholder="masterKey">
            <button v-if="!runBackupCleanupResMsg" @click="runBackupCleanup" class="ok">运行</button>
            <div v-else>{{ runBackupCleanupResMsg }}</div>
        </template>
        <template v-if="mode=='migrateDb'">
            <input v-model="masterKey" placeholder="masterKey">
            <button v-if="!migrateDbResMsg" @click="migrateDb" class="ok">更新</button>
            <div v-else>{{ migrateDbResMsg }}</div>
        </template>
        <template v-if="mode=='removeAllPublicSaveEditAuthGrants'">
            <input v-model="masterKey" placeholder="masterKey">
            <button v-if="!removeAllPublicSaveEditAuthGrantsMsg" @click="removeAllPublicSaveEditAuthGrants" class="ok">执行</button>
            <div v-else>{{ removeAllPublicSaveEditAuthGrantsMsg }}</div>
        </template>
        <template v-if="mode=='setUserAsAdmin'">
            <input v-model.number="setUserAsAdminUserId" placeholder="用户Id" type="number">
            <input v-model="masterKey" placeholder="masterKey">
            <button v-if="!setUserAsAdminResMsg" @click="setUserAsAdmin" class="ok">执行</button>
            <div v-else>{{ setUserAsAdminResMsg }}</div>
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