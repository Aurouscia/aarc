<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue';
import { useApiStore } from '@/app/com/apiStore';
import { SaveDto } from '@/app/com/apiGenerated';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import defaultMini from '@/assets/defaultMini.svg';
import SideBar from '@/components/common/SideBar.vue';

const api = useApiStore()
const { showPop } = useUniqueComponentsStore()
const saves = ref<SaveDto[]>()
const loading = ref(false)
const sidebar = useTemplateRef('sidebar')
const selectedSave = ref<SaveDto>()

async function load() {
    loading.value = true
    saves.value = await api.save.getMyDeletedSaves()
    loading.value = false
}

function openSidebar(s: SaveDto) {
    selectedSave.value = s
    sidebar.value?.extend()
}

function formatElapsed(lastActiveUnix: number | undefined): string {
    if (lastActiveUnix === undefined) return '-'
    const diffMs = Date.now() - lastActiveUnix
    if (diffMs < 0) return '刚刚'
    const oneHour = 60 * 60 * 1000
    const oneDay = 24 * oneHour
    if (diffMs < oneHour) {
        return `${Math.floor(diffMs / (60 * 1000))}分钟前`
    }
    if (diffMs < oneDay) {
        return `${Math.floor(diffMs / oneHour)}小时前`
    }
    return `${Math.floor(diffMs / oneDay)}天前`
}

async function restoreSave() {
    const id = selectedSave.value?.id
    if (!id) return
    const success = await api.save.restore(id)
    if (success) {
        showPop('已恢复', 'success')
        sidebar.value?.fold()
        await load()
    }
}

async function permanentlyDeleteSave() {
    const id = selectedSave.value?.id
    if (!id) return
    if (!window.confirm('永久删除后无法恢复，是否继续？')) return
    const success = await api.save.permanentRemove(id)
    if (success) {
        showPop('已永久删除', 'success')
        sidebar.value?.fold()
        await load()
    }
}

onMounted(() => {
    load()
})
</script>

<template>
    <h1>回收站</h1>

    <div v-if="loading" class="empty-tip">加载中...</div>
    <div v-else-if="saves && saves.length === 0" class="empty-tip">回收站为空</div>
    <div v-else-if="saves" class="save-cards">
        <div
            v-for="s in saves"
            :key="s.id"
            class="save-card"
            @click="openSidebar(s)"
        >
            <img class="save-mini" :src="s.miniUrl || defaultMini" :alt="s.name || '存档'" />
            <div class="save-name" :title="s.name || undefined">{{ s.name }}</div>
            <div class="save-stats">{{ s.staCount }}站 / {{ s.lineCount }}线</div>
            <div class="save-last-active">{{ s.lastActive }}</div>
            <div class="save-elapsed">{{ formatElapsed(s.lastActiveUnix) }}</div>
        </div>
    </div>

    <SideBar ref="sidebar">
        <h1>{{ selectedSave?.name || '存档' }}</h1>
        <div class="sidebar-content">
            <img
                v-if="selectedSave"
                class="sidebar-mini"
                :src="selectedSave.miniUrl || defaultMini"
                :alt="selectedSave.name || '存档'"
            />
            <div v-if="selectedSave" class="sidebar-info">
                <div>{{ selectedSave.staCount }}站 / {{ selectedSave.lineCount }}线</div>
                <div>{{ selectedSave.lastActive }}</div>
                <div>{{ formatElapsed(selectedSave.lastActiveUnix) }}</div>
            </div>
            <button @click="restoreSave">恢复该存档</button>
            <button class="danger" @click="permanentlyDeleteSave">永久删除该存档</button>
        </div>
    </SideBar>
</template>

<style scoped lang="scss">
.empty-tip {
    text-align: center;
    color: #666;
    margin: 40px 0;
}

.save-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 10px 0;
}

.save-card {
    width: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    border-radius: 8px;
    border: 2px solid #eee;
    background-color: white;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: cornflowerblue;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .save-mini {
        width: 120px;
        height: 120px;
        object-fit: contain;
        margin-bottom: 8px;
        border-radius: 6px;
    }

    .save-name {
        font-size: 15px;
        font-weight: 500;
        text-align: center;
        word-break: break-all;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .save-stats {
        font-size: 13px;
        color: #666;
        margin-top: 4px;
    }

    .save-last-active,
    .save-elapsed {
        font-size: 12px;
        color: #999;
        margin-top: 2px;
    }
}

.sidebar-content {
    display: flex;
    flex-direction: column;
    align-items: center;

    .sidebar-mini {
        width: 160px;
        height: 160px;
        object-fit: contain;
        border-radius: 8px;
        margin-bottom: 12px;
    }

    .sidebar-info {
        text-align: center;
        font-size: 14px;
        color: #666;
        margin-bottom: 16px;
        line-height: 1.6;
    }

    button {
        width: 160px;
        margin-bottom: 10px;
    }
}
</style>
