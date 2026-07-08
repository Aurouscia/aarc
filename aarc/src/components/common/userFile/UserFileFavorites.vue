<script setup lang="ts">
import { ref } from 'vue';
import { UserFileDto, UserFavoriteType } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import SideBar from '@/components/common/SideBar.vue';
import { useUserFileFavoriteStore } from '@/models/stores/utils/userFileFavoriteStore';
import { storeToRefs } from 'pinia';

const api = useApiStore()
const { showPop } = useUniqueComponentsStore()
const { openFavoritesSidebar, onFavoriteFileSelected } = storeToRefs(useUserFileFavoriteStore())
const sidebar = ref<InstanceType<typeof SideBar>>()
const search = ref('')
const files = ref<UserFileDto[]>()
const loading = ref(false)
const urlBase = import.meta.env.VITE_ApiUrlBase

async function load() {
    loading.value = true
    const searchVal = search.value.trim() || undefined
    const res = await api.userFavorite.getUserFiles(UserFavoriteType.UserFile, searchVal, 0, 30)
    if (res) {
        files.value = res
    }
    loading.value = false
}

function open() {
    sidebar.value?.extend()
    if (!files.value) {
        load()
    }
}

openFavoritesSidebar.value = open

function onSearchInput() {
    if (!search.value.trim()) {
        load()
    }
}

function select(file: UserFileDto) {
    onFavoriteFileSelected.value(file)
    showPop('已添加', 'success')
}

defineExpose({ open })
</script>

<template>
    <SideBar ref="sidebar">
        <h1>收藏的资源</h1>
        <div class="search-control">
            <input
                v-model="search"
                @input="onSearchInput"
                @blur="load"
                @keyup.enter="load"
                placeholder="搜索收藏的资源"
            />
        </div>
        <div v-if="loading" class="loading-tip">加载中...</div>
        <div v-else class="file-list">
            <div v-if="files?.length === 0" class="empty-state">暂无收藏的资源</div>
            <div v-for="file in files" :key="file.id" class="file-item">
                <img class="file-thumb" :src="urlBase + file.urlThumb" :alt="file.displayName" />
                <span class="file-name" :title="file.displayName">{{ file.displayName || '未命名文件' }}</span>
                <button class="lite confirm" @click="select(file)">取用</button>
            </div>
        </div>
    </SideBar>
</template>

<style scoped lang="scss">
.search-control {
    margin-bottom: 10px;
    input {
        width: 100%;
        box-sizing: border-box;
    }
}
.loading-tip {
    text-align: center;
    padding: 40px 0;
    color: #999;
}
.empty-state {
    text-align: center;
    padding: 40px 0;
    color: #999;
}
.file-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.file-item {
    display: flex;
    align-items: center;
    gap: 10px;
}
.file-thumb {
    width: 30px;
    height: 30px;
    object-fit: cover;
    flex-shrink: 0;
}
.file-name {
    width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-grow: 1;
}
</style>
