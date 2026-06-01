<script setup lang="ts">
import { onMounted, ref, computed, useTemplateRef, nextTick, watch } from 'vue';
import { useApiStore } from '@/app/com/apiStore';
import { SaveFolderDto, SaveFolderPathItem, SaveDto } from '@/app/com/apiGenerated';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { useRouter, useRoute } from 'vue-router';
import { saveFoldersName } from './routes/routesNames';
import SideBar from '@/components/common/SideBar.vue';
import folderIcon from '@/assets/ui/folder.svg';
import { useSavesRoutesJump } from './routes/routesJump';
import { WithIntroShow } from '@/utils/type/WithIntroShow';
import SaveList from './components/SaveList.vue';

const api = useApiStore()
const router = useRouter()
const route = useRoute()
const { showPop } = useUniqueComponentsStore()
const { userInfo } = useUserInfoStore()
useSavesRoutesJump()

const folderId = computed(() => {
    const id = parseInt(route.params['folderId'] as string || '0')
    return isNaN(id) ? 0 : id
})

const folders = ref<SaveFolderDto[]>()
const saves = ref<WithIntroShow<SaveDto>[]>()
const path = ref<SaveFolderPathItem[]>([])
const loading = ref(false)

async function load() {
    loading.value = true
    const [f, p] = await Promise.all([
        api.saveFolder.getMyFolders(folderId.value),
        api.saveFolder.getPath(folderId.value)
    ])
    folders.value = f
    path.value = p || []

    if (folderId.value > 0) {
        const saveList = await api.saveFolder.getSavesInFolder(folderId.value)
        saves.value = (saveList || []).map(s => ({ ...s, introShow: false }))
    } else {
        saves.value = []
    }
    loading.value = false
}

function enterFolder(id: number) {
    router.push({ name: saveFoldersName, params: { folderId: id } })
}

function goToRoot() {
    router.push({ name: saveFoldersName })
}

function goToFolderByIndex(index: number) {
    if (index < 0) {
        goToRoot()
        return
    }
    const target = path.value[index]
    if (target.id === folderId.value) return
    router.push({ name: saveFoldersName, params: { folderId: target.id } })
}

// 新建/编辑文件夹
const folderSb = useTemplateRef('folderSb')
const isCreatingFolder = ref(false)
const editingFolder = ref<SaveFolderDto>({ id: 0, name: '' })

function startCreatingFolder() {
    isCreatingFolder.value = true
    editingFolder.value = { id: 0, name: '', parentFolderId: folderId.value }
    nextTick(() => folderSb.value?.extend())
}

async function startEditingCurrentFolder() {
    const info = await api.saveFolder.getFolderInfo(folderId.value)
    if (!info) {
        showPop('无法获取目录信息', 'failed')
        return
    }
    isCreatingFolder.value = false
    editingFolder.value = { ...info }
    nextTick(() => folderSb.value?.extend())
}

async function doneFolder() {
    if (!editingFolder.value?.name) {
        showPop('名称不能为空', 'failed')
        return
    }
    let res: boolean | undefined
    if (isCreatingFolder.value) {
        res = await api.saveFolder.create(editingFolder.value)
    } else {
        res = await api.saveFolder.update(editingFolder.value)
    }
    if (res) {
        folderSb.value?.fold()
        showPop(isCreatingFolder.value ? '创建成功' : '更新成功', 'success')
        await load()
    }
}

async function removeFolder() {
    const targetId = editingFolder.value?.id
    if (!targetId) return
    if (!window.confirm('删除文件夹将同时清空其中的存档归类，是否继续？')) return
    const res = await api.saveFolder.remove(targetId)
    if (res) {
        folderSb.value?.fold()
        showPop('删除成功', 'success')
        goToRoot()
    }
}

async function removeSaveFromFolder(saveId?: number) {
    if (!saveId || !folderId.value) return
    const res = await api.saveFolder.removeSaveFromFolder(saveId, folderId.value)
    if (res) {
        showPop('已移出', 'success')
        await load()
    }
}

onMounted(() => {
    load()
})

watch(() => route.params.folderId, () => {
    load()
})
</script>

<template>
    <h1 class="h1WithBtns">
        <div class="breadcrumb">
            <span class="breadcrumb-root" @click="goToRoot">📁</span>
            <template v-for="(p, i) in path" :key="p.id">
                <span class="breadcrumb-sep">/</span>
                <span class="breadcrumb-item" :class="{ active: p.id === folderId }" @click="goToFolderByIndex(i)">
                    {{ p.name }}
                </span>
            </template>
            <span v-if="!folderId" class="breadcrumb-item active">我的文件夹</span>
        </div>
        <div v-if="!userInfo.isTourist">
            <button v-if="folderId > 0" @click="startEditingCurrentFolder">编辑目录</button>
            <button @click="startCreatingFolder">新建文件夹</button>
        </div>
    </h1>

    <!-- 子文件夹网格 -->
    <div v-if="folders && folders.length > 0" class="folder-grid">
        <div v-for="f in folders" :key="f.id" class="folder-card" @click="enterFolder(f.id || 0)">
            <img :src="folderIcon" class="folder-icon" />
            <div class="folder-name">{{ f.name }}</div>
            <div v-if="f.intro" class="folder-intro">{{ f.intro }}</div>
        </div>
    </div>

    <!-- 存档列表（根目录不显示） -->
    <div v-if="folderId > 0">
        <SaveList v-if="saves && saves.length > 0" :saves="saves" :is-mine="true"
            :extra-action="[{ label: '移出', onClick: (s) => removeSaveFromFolder(s.id) }]"
            @refresh="load">
        </SaveList>
        <div v-else-if="saves" class="empty-saves-tip">当前目录暂无存档</div>
    </div>

    <SideBar ref="folderSb">
        <h1>{{ isCreatingFolder ? '新建文件夹' : '编辑文件夹' }}</h1>
        <table class="fullWidth">
            <tbody>
                <tr>
                    <td>名称</td>
                    <td>
                        <input v-model="editingFolder.name" placeholder="最多64字符" maxlength="64" />
                    </td>
                </tr>
                <tr>
                    <td>简介</td>
                    <td>
                        <textarea v-model="editingFolder.intro" placeholder="最多128字符" rows="3" maxlength="128"></textarea>
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                        <button @click="doneFolder">确认</button>
                        <button v-if="!isCreatingFolder" class="danger-text" @click="removeFolder()">删除目录</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </SideBar>
</template>

<style scoped lang="scss">
.breadcrumb {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
    font-size: 18px;

    .breadcrumb-root {
        cursor: pointer;
        font-size: 20px;

        &:hover {
            opacity: 0.7;
        }
    }

    .breadcrumb-sep {
        color: #999;
        margin: 0 2px;
    }

    .breadcrumb-item {
        cursor: pointer;
        color: #666;
        padding: 2px 6px;
        border-radius: 4px;

        &:hover {
            background-color: #eee;
            text-decoration: underline;
        }

        &.active {
            color: #333;
            font-weight: bold;
            cursor: default;

            &:hover {
                background-color: transparent;
                text-decoration: none;
            }
        }
    }
}

.folder-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    padding: 10px 0 20px;
    margin-bottom: 10px;
    border-bottom: 1px solid #ddd;

    .folder-card {
        width: 120px;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 8px;
        border-radius: 8px;
        border: 2px solid #eee;
        cursor: pointer;
        transition: all 0.2s;
        background-color: white;

        &:hover {
            border-color: cornflowerblue;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .folder-icon {
            width: 48px;
            height: 48px;
            color: #f0c040;
            margin-bottom: 6px;
        }

        .folder-name {
            font-size: 14px;
            font-weight: 500;
            text-align: center;
            word-break: break-all;
            max-width: 100%;
        }

        .folder-intro {
            font-size: 12px;
            color: #999;
            text-align: center;
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
        }
    }
}

.danger-text {
    color: red !important;

    &:hover {
        color: darkred !important;
    }
}
</style>
