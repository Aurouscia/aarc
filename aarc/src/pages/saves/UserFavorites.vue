<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';

import { useApiStore } from '@/app/com/apiStore';
import { SaveDto, UserFavoriteType, GroupWithStatus } from '@/app/com/apiGenerated';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { useRouter, useRoute } from 'vue-router';
import { userFavoritesName } from './routes/routesNames';
import SaveList from './components/SaveList.vue';
import { WithIntroShow } from '@/utils/type/WithIntroShow';
import { useSavesRoutesJump } from './routes/routesJump';
import { useSaveListLocalConfigStore } from '@/app/localConfig/saveListLocalConfig';

const api = useApiStore()
const router = useRouter()
const route = useRoute()
const { userInfo } = useUserInfoStore()
const { mySavesRoute } = useSavesRoutesJump()
const saveListLocalConfig = useSaveListLocalConfigStore()

const props = defineProps<{
    group?: string
}>()

const allGroupsLabel = '全部'

const selectedGroup = computed<string>(() => {
    return props.group ?? (route.query.group as string | undefined) ?? ''
})

const groups = ref<GroupWithStatus[]>([])
const saves = ref<WithIntroShow<SaveDto>[]>()
const loading = ref(false)
const skip = ref(0)
const hasMore = ref(false)
const pageSize = 30

const groupOptions = computed(() => {
    const opts = groups.value
        .map(g => g.name)
        .filter((n): n is string => !!n)
    return [allGroupsLabel, ...opts]
})

const displayTitle = computed(() => {
    if (!selectedGroup.value || selectedGroup.value === allGroupsLabel) {
        return '我的收藏'
    }
    return `我的收藏 - ${selectedGroup.value}`
})

async function loadGroups() {
    const res = await api.userFavorite.groups(UserFavoriteType.Save, 0)
    groups.value = res || []
}

async function loadSaves(append: boolean = false) {
    loading.value = true
    if (!append) {
        saves.value = undefined
        skip.value = 0
        hasMore.value = false
    }
    const group = selectedGroup.value === allGroupsLabel ? null : selectedGroup.value
    const res = await api.userFavorite.getSaves(UserFavoriteType.Save, group, skip.value, pageSize)
    const list = (res?.saves || []).map(s => ({ ...s, introShow: false }))
    if (append && saves.value) {
        saves.value = [...saves.value, ...list]
    } else {
        saves.value = list
    }
    hasMore.value = res?.hasMore ?? false
    loading.value = false
}

async function loadMore() {
    if (loading.value || !hasMore.value) return
    skip.value += pageSize
    await loadSaves(true)
}

const isInitializing = ref(false)

async function load() {
    isInitializing.value = true
    await loadGroups()
    const persistedGroup = saveListLocalConfig.favoriteGroup
    const initialGroup = persistedGroup && groupOptions.value.includes(persistedGroup)
        ? persistedGroup
        : ''
    if (saveListLocalConfig.favoriteGroup !== initialGroup) {
        saveListLocalConfig.favoriteGroup = initialGroup
    }
    if (selectedGroup.value !== initialGroup) {
        await router.replace({
            name: userFavoritesName,
            params: initialGroup ? { group: initialGroup } : {}
        })
    }
    isInitializing.value = false
    await loadSaves(false)
}

function selectGroup(group: string) {
    const groupValue = group === allGroupsLabel ? '' : group
    if (saveListLocalConfig.favoriteGroup !== groupValue) {
        saveListLocalConfig.favoriteGroup = groupValue
    }
    if (group === allGroupsLabel) {
        router.push({ name: userFavoritesName })
    } else {
        router.push({ name: userFavoritesName, params: { group } })
    }
}

async function fork(id?: number) {
    const resp = await api.save.fork(id)
    if (resp) {
        router.push(mySavesRoute())
    }
}

watch(() => props.group, () => {
    if (isInitializing.value) return
    const groupValue = selectedGroup.value === allGroupsLabel ? '' : selectedGroup.value
    if (saveListLocalConfig.favoriteGroup !== groupValue) {
        saveListLocalConfig.favoriteGroup = groupValue
    }
    loadSaves(false)
})

onMounted(() => {
    load()
})
</script>

<template>
    <h1 class="h1WithBtns">
        <span>{{ displayTitle }}</span>
        <div class="group-ops">
            <select :value="selectedGroup || allGroupsLabel" @change="selectGroup(($event.target as HTMLSelectElement).value)">
                <option v-for="g in groupOptions" :key="g" :value="g">{{ g }}</option>
            </select>
        </div>
    </h1>

    <SaveList v-if="saves && saves.length > 0" :saves="saves" :is-mine="false" :show-fork="true"
        :show-comment="(s: SaveDto) => s.ownerUserId === userInfo.id" @refresh="loadSaves(false)" @fork="fork">
    </SaveList>
    <div v-else-if="saves" class="empty-saves-tip">
        当前分组暂无收藏
    </div>

    <div v-if="hasMore" class="load-more-area">
        <button class="minor" :disabled="loading" @click="loadMore">
            {{ loading ? '加载中...' : '加载更多' }}
        </button>
    </div>
</template>

<style scoped lang="scss">
.group-ops {
    margin-left: auto;

    select {
        font-size: 16px;
    }
}

.empty-saves-tip {
    text-align: center;
    color: #666;
    margin: 20px 0;
}

.load-more-area {
    text-align: center;
    margin: 20px 0;

    button {
        padding-left: 24px;
        padding-right: 24px;
    }
}
</style>
