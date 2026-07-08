<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { UserFileDto } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import UserFiles from './component/UserFiles.vue';

const api = useApiStore()

const recommended = ref<UserFileDto[]>()
const searchResults = ref<UserFileDto[]>()
const searchStr = ref('')
const hasSearched = ref(false)

async function loadRecommend() {
    const res = await api.userFileRecommend.get(10)
    if (res) {
        recommended.value = res
    }
}

async function doSearch() {
    hasSearched.value = true
    if (!searchStr.value.trim()) {
        searchResults.value = []
        return
    }
    const res = await api.userFile.search(searchStr.value, 'time', 0, 50)
    if (res) {
        searchResults.value = res
    }
}

onMounted(() => {
    loadRecommend()
})
</script>

<template>
    <h1 class="h1WithBtns">
        资源广场
        <div>
            <input v-model="searchStr" @blur="doSearch" @keyup.enter="doSearch" placeholder="搜索资源名"/>
        </div>
    </h1>
    <div v-if="hasSearched" class="user-file-market-container">
        <h2>搜索结果</h2>
        <UserFiles
            :files="searchResults ?? []"
            empty-text="未搜索到相关资源"
            :allow-edit="false"
        />
    </div>
    <div v-else class="user-file-market-container">
        <h2>推荐资源</h2>
        <UserFiles
            :files="recommended ?? []"
            empty-text="暂无推荐资源"
            :allow-edit="false"
        />
    </div>
</template>

<style scoped lang="scss">
.user-file-market-container {
    h2 {
        font-size: 18px;
        margin: 10px 0;
    }
}
</style>
