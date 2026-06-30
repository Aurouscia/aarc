<script setup lang="ts">
import { ref, watch } from 'vue';
import Prompt from '@/components/common/Prompt.vue';
import { useApiStore } from '@/app/com/apiStore';
import { UserFavoriteType, GroupWithStatus } from '@/app/com/apiGenerated';
import gearIcon from '@/assets/ui/gear.svg';

const props = defineProps<{
    type: UserFavoriteType,
    objectId: number,
    show: boolean
}>()

const emit = defineEmits<{
    (e: 'close'): void,
    (e: 'updated', isFavorited: boolean): void
}>()

const api = useApiStore()
const groups = ref<GroupWithStatus[]>([])
const loading = ref(false)
const errorMsg = ref<string>()
const showNewGroupInput = ref(false)
const newGroupName = ref('')
const newGroupError = ref<string>()
const expandedGroup = ref<string | null>(null)
const renameValue = ref('')
const renameError = ref<string>()

const defaultGroupName = '默认'

async function load() {
    loading.value = true
    errorMsg.value = undefined
    showNewGroupInput.value = false
    newGroupName.value = ''
    newGroupError.value = undefined
    expandedGroup.value = null
    renameValue.value = ''
    renameError.value = undefined
    try {
        const res = await api.userFavorite.groups(props.type, props.objectId)
        if (!res) {
            errorMsg.value = '加载分组失败'
            return
        }
        if (res.length === 0) {
            groups.value = [{ name: defaultGroupName, checked: true }]
        } else {
            groups.value = res
        }
    } catch {
        errorMsg.value = '加载分组失败'
    } finally {
        loading.value = false
    }
}

watch(() => props.show, (show) => {
    if (show) {
        groups.value = []
        load()
    }
}, { immediate: true })

function addCustomGroup() {
    newGroupError.value = undefined
    let name = newGroupName.value.trim()
    if (!name) {
        newGroupError.value = '分组名称不能为空'
        return
    }
    if (name.length > 16)
        name = name.slice(0, 16)
    if (groups.value.some(g => g.name === name)) {
        newGroupError.value = '该分组已存在'
        return
    }
    groups.value.push({ name, checked: true })
    newGroupName.value = ''
    showNewGroupInput.value = false
}

function toggleExpand(groupName: string) {
    renameError.value = undefined
    if (expandedGroup.value === groupName) {
        expandedGroup.value = null
    } else {
        expandedGroup.value = groupName
        renameValue.value = groupName
    }
}

async function renameGroup(group: GroupWithStatus) {
    if (!group.name) return
    renameError.value = undefined
    let newName = renameValue.value.trim()
    if (!newName) {
        renameError.value = '分组名称不能为空'
        return
    }
    if (newName.length > 16)
        newName = newName.slice(0, 16)
    if (newName === group.name) {
        expandedGroup.value = null
        return
    }
    if (groups.value.some(g => g.name === newName)) {
        renameError.value = '该分组已存在'
        return
    }
    loading.value = true
    const res = await api.userFavorite.renameGroup(props.type, group.name, newName)
    loading.value = false
    if (res) {
        group.name = newName
        expandedGroup.value = null
    } else {
        renameError.value = '重命名失败'
    }
}

async function deleteGroup(group: GroupWithStatus) {
    if (!group.name) return
    if (!window.confirm(`确认删除分组“${group.name}”？将会丢失里面的收藏项`)) return
    loading.value = true
    const res = await api.userFavorite.deleteGroup(props.type, group.name)
    loading.value = false
    if (res) {
        groups.value = groups.value.filter(g => g.name !== group.name)
        expandedGroup.value = null
    }
}

async function confirm() {
    if (loading.value) return
    if (showNewGroupInput.value && newGroupName.value.trim()) {
        addCustomGroup()
    }
    if (newGroupError.value)
        return
    loading.value = true
    errorMsg.value = undefined
    try {
        const selected = groups.value
            .filter(g => g.checked)
            .map(g => g.name)
            .filter((n): n is string => !!n)
        const newIsFavorited = await api.userFavorite.setGroups(
            props.type,
            props.objectId,
            selected
        )
        if (newIsFavorited === undefined) {
            errorMsg.value = '保存失败'
            return
        }
        emit('updated', newIsFavorited)
        emit('close')
    } catch {
        errorMsg.value = '保存失败'
    } finally {
        loading.value = false
    }
}

function close() {
    if (!loading.value)
        emit('close')
}
</script>

<template>
    <Prompt v-if="show" :bgClickClose="true" @close="close">
        <div class="ufg-prompt">
            <div class="title">收藏分组</div>
            <div v-if="loading && groups.length === 0" class="loading">加载中...</div>
            <div v-else-if="errorMsg" class="error">{{ errorMsg }}</div>
            <div v-else class="group-list">
                <div v-for="(group, index) in groups" :key="group.name ?? index" class="group-item" :class="{ expanded: expandedGroup === group.name }">
                    <div class="group-main">
                        <label class="group-label">
                            <input
                                type="checkbox"
                                v-model="group.checked"
                                :disabled="loading"
                            />
                            <span>{{ group.name }}</span>
                        </label>
                        <img
                            class="gear-icon"
                            :src="gearIcon"
                            @click.stop="toggleExpand(group.name!)"
                            :class="{ active: expandedGroup === group.name }"
                        />
                    </div>
                    <div v-if="expandedGroup === group.name" class="group-actions">
                        <input
                            v-model="renameValue"
                            type="text"
                            placeholder="新分组名称"
                            maxlength="16"
                            :disabled="loading"
                            @keydown.enter.prevent="renameGroup(group)"
                        />
                        <button class="lite confirm" @click="renameGroup(group)" :disabled="loading">重命名</button>
                        <button class="lite" @click="deleteGroup(group)" :disabled="loading">删除</button>
                        <div v-if="renameError" class="rename-error">{{ renameError }}</div>
                    </div>
                </div>
            </div>
            <div class="new-group-area">
                <button v-if="!showNewGroupInput" class="lite new-group-btn" @click="showNewGroupInput = true" :disabled="loading">
                    + 新收藏分组
                </button>
                <div v-else class="new-group-input-row">
                    <input
                        v-model="newGroupName"
                        type="text"
                        placeholder="输入分组名称"
                        maxlength="16"
                        :disabled="loading"
                        @keydown.enter.prevent="addCustomGroup"
                    />
                    <button class="lite confirm" @click="addCustomGroup" :disabled="loading">添加</button>
                    <button class="lite" @click="showNewGroupInput = false; newGroupName = ''; newGroupError = undefined" :disabled="loading">取消</button>
                </div>
                <div v-if="newGroupError" class="new-group-error">{{ newGroupError }}</div>
            </div>
            <div class="buttons">
                <button class="minor" @click="close" :disabled="loading">取消</button>
                <button @click="confirm" :disabled="loading">{{ loading ? '保存中...' : '确认' }}</button>
            </div>
        </div>
    </Prompt>
</template>

<style lang="scss" scoped>
.ufg-prompt {
    min-width: 220px;
    max-width: 320px;
    .title {
        font-size: 16px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 10px;
    }
    .loading, .empty, .error {
        text-align: center;
        padding: 20px 0;
        color: #666;
    }
    .error {
        color: #c0392b;
    }
    .group-list {
        max-height: 260px;
        overflow-y: auto;
        margin-bottom: 10px;
        .group-item {
            background-color: #eee;
            border-radius: 6px;
            margin-bottom: 4px;
            padding: 8px 10px;
            &:last-child {
                margin-bottom: 0;
            }
            .group-main {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                .group-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                    cursor: pointer;
                    input[type="checkbox"] {
                        width: 16px;
                        height: 16px;
                        cursor: pointer;
                    }
                    span {
                        font-size: 14px;
                    }
                }
                .gear-icon {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                    filter: brightness(0);
                    &:hover, &.active {
                        opacity: 1;
                    }
                }
            }
            .group-actions {
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid #ddd;
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                input {
                    flex: 1;
                    width: 80px;
                    padding: 4px 8px;
                    font-size: 14px;
                }
                button {
                    white-space: nowrap;
                    font-size: 14px;
                }
                .rename-error {
                    width: 100%;
                    color: #c0392b;
                    font-size: 12px;
                }
            }
        }
    }
    .new-group-area {
        margin-bottom: 10px;
        .new-group-btn {
            width: 100%;
            text-align: center;
        }
        .new-group-input-row {
            display: flex;
            gap: 6px;
            input {
                flex: 1;
                padding: 4px 8px;
                font-size: 14px;
            }
            button {
                white-space: nowrap;
            }
        }
        .new-group-error {
            color: #c0392b;
            font-size: 12px;
            margin-top: 4px;
        }
    }
    .buttons {
        display: flex;
        justify-content: center;
        gap: 10px;
        button {
            min-width: 70px;
        }
    }
}
</style>
