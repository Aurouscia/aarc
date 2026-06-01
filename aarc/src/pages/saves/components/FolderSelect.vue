<script setup lang="ts">
import { SaveFolderDto } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import Prompt from '@/components/common/Prompt.vue';
import { ref, computed, onMounted } from 'vue';

const props = defineProps<{
    excludeIds?: number[]
}>()

const api = useApiStore()
const allFolders = ref<SaveFolderDto[]>([])

onMounted(async () => {
    const res = await api.saveFolder.getAllMyFolders()
    allFolders.value = res || []
    emit('loaded', allFolders.value)
})

const nameSearch = ref('')
const selectedIndex = ref(-1)

const filteredFolders = computed(() => {
    const search = nameSearch.value.trim().toLowerCase()
    let list = allFolders.value
    if (props.excludeIds && props.excludeIds.length > 0) {
        list = list.filter(f => !props.excludeIds!.includes(f.id || 0))
    }
    if (!search) return list
    return list.filter(f => f.name?.toLowerCase().includes(search))
})

const hasFolders = computed(() => filteredFolders.value.length > 0)

function selectFolder(f: SaveFolderDto | undefined) {
    emit('select', f)
}

function selectCurrentFolder() {
    if (selectedIndex.value >= 0 && selectedIndex.value < filteredFolders.value.length) {
        selectFolder(filteredFolders.value[selectedIndex.value])
    }
}

function handleKeydown(e: KeyboardEvent) {
    if (!hasFolders.value) return
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault()
            selectedIndex.value = (selectedIndex.value + 1) % filteredFolders.value.length
            break
        case 'ArrowUp':
            e.preventDefault()
            selectedIndex.value = selectedIndex.value <= 0
                ? filteredFolders.value.length - 1
                : selectedIndex.value - 1
            break
        case 'Enter':
            e.preventDefault()
            selectCurrentFolder()
            break
    }
}

const emit = defineEmits<{
    (e: 'select', f: SaveFolderDto | undefined): void
    (e: 'loaded', folders: SaveFolderDto[]): void
}>()
</script>

<template>
    <Prompt @close="selectFolder(undefined)" :bg-click-close="true">
        <div class="folder-select-title">目录选择器</div>
        <div class="folder-select">
            <input ref="inputRef" v-model="nameSearch" placeholder="搜索目录名" @keydown="handleKeydown" />
            <div class="folder-select-res">
                <div v-for="(folder, index) in filteredFolders" :key="folder.id" @click="selectFolder(folder)"
                    @mouseenter="selectedIndex = index" :class="{ 'selected': index === selectedIndex }">
                    {{ folder.name }}
                </div>
                <div v-if="!hasFolders" class="no-result">无匹配目录</div>
            </div>
        </div>
    </Prompt>
</template>

<style scoped lang="scss">
.folder-select-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 8px;
    text-align: center;
}

.folder-select {
    width: 240px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 10px;

    input {
        align-self: center;
    }

    .folder-select-res {
        height: 300px;
        overflow-y: auto;

        &>div {
            padding: 5px;
            margin-bottom: 5px;
            border-radius: 5px;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            &:hover,
            &.selected {
                background-color: #ddd;
            }
        }

        .no-result {
            color: #999;
            text-align: center;
            cursor: default;

            &:hover {
                background-color: transparent;
            }
        }
    }
}
</style>
