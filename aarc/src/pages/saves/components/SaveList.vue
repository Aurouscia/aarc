<script setup lang="ts">
import { ref, nextTick, useTemplateRef, computed, watch } from 'vue';
import { useApiStore } from '@/app/com/apiStore';
import SideBar from '@/components/common/SideBar.vue';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import fileDownload from 'js-file-download';
import Loading from '@/components/common/Loading.vue';
import { Save, saveLineCount, saveStaCount } from '@/models/save';
import defaultMini from '@/assets/defaultMini.svg'
import { SaveDto, SaveFolderDto } from '@/app/com/apiGenerated';
import { WithIntroShow } from '@/utils/type/WithIntroShow';

import AuthGrantEdit from '../../components/AuthGrantEdit.vue';
import { AuthGrantOn, AuthGrantTypeOfSave } from '@/app/com/apiGenerated';
import SwitchingTabs from '@/components/common/SwitchingTabs.vue';
import SaveAvatar from '../../components/SaveAvatar.vue';
import { useSavesRoutesJump } from '../routes/routesJump';
import SaveBackups from '../../components/SaveBackups.vue';
import ConvertToRailChess from '../../components/ConvertToRailChess.vue';
import FolderSelect from './FolderSelect.vue';
import CommentList from '@/components/common/CommentList.vue';

const props = defineProps<{
    saves: WithIntroShow<SaveDto>[] | undefined
    isMine: boolean
    showFork?: boolean
    extraAction?: { label: string, onClick: (save: SaveDto) => void }[]
    folderMode?: boolean
    folderId?: number
    orderBy?: string
}>()

const emit = defineEmits<{
    refresh: []
    fork: [id?: number]
    orderChanged: [ids: number[]]
}>()

const api = useApiStore();
const { showPop } = useUniqueComponentsStore()
const { saveDiffsRoute } = useSavesRoutesJump()

const saveInfoSb = useTemplateRef('saveInfoSb')
const editingSave = ref<SaveDto>()
const isCreatingSave = ref(false)

// 本地顺序管理（目录模式）
const localSaves = ref<WithIntroShow<SaveDto>[]>([])
const initialOrder = ref<number[]>([])
const orderDirty = computed(() => {
    if (localSaves.value.length !== initialOrder.value.length) return false
    for (let i = 0; i < localSaves.value.length; i++) {
        if (localSaves.value[i].id !== initialOrder.value[i]) return true
    }
    return false
})

watch(() => props.saves, (val: WithIntroShow<SaveDto>[] | undefined) => {
    if (val) {
        localSaves.value = [...val]
        initialOrder.value = val.map((s: WithIntroShow<SaveDto>) => s.id).filter((id): id is number => id !== undefined)
    } else {
        localSaves.value = []
        initialOrder.value = []
    }
}, { immediate: true })

function moveUp(index: number) {
    if (index <= 0) return
    const arr = [...localSaves.value]
    const temp = arr[index]
    arr[index] = arr[index - 1]
    arr[index - 1] = temp
    localSaves.value = arr
}

async function saveOrder() {
    if (!props.folderId) return
    const ids = localSaves.value.map(s => s.id).filter((id): id is number => id !== undefined)
    const res = await api.saveFolder.rearrangeSavesInFolder(props.folderId, ids)
    if (res) {
        initialOrder.value = ids
        showPop('顺序已保存', 'success')
        emit('orderChanged', ids)
    }
}

function startCreating() {
    isCreatingSave.value = true
    editingSave.value = { id: 0, name: '' }
    nextTick(() => saveInfoSb.value?.extend())
}

function startEditingInfo(s: SaveDto) {
    isCreatingSave.value = false
    editingSave.value = s
    loadFolderInfo()
    nextTick(() => saveInfoSb.value?.extend())
}

async function done() {
    if (!editingSave.value)
        return
    let p: Promise<boolean | undefined>
    if (isCreatingSave.value)
        p = api.save.add(editingSave.value)
    else
        p = api.save.updateInfo(editingSave.value)
    const success = await p
    if (success) {
        saveInfoSb.value?.fold()
        emit('refresh')
        showPop('操作成功', 'success')
    }
}

const dangerZone = ref(false)
const repeatCvsName = ref("")
const jsonFileInput = useTemplateRef('jsonFileInput')
const jsonContent = ref<string>()
const jsonSaveStaCount = ref<number>()
const jsonSaveLineCount = ref<number>()
const jsonLastModified = ref<string>()

async function removeCurrentCvs() {
    if (repeatCvsName.value !== editingSave.value?.name) {
        showPop('请一字不差输入画布名称', 'failed')
        return
    }
    const resp = await api.save.remove(editingSave.value.id)
    if (resp) {
        saveInfoSb.value?.fold()
        emit('refresh')
    }
}

function selectReplaceJson() {
    resetReplaceJson()
    const f = jsonFileInput.value?.files?.item(0)
    if (!f)
        return
    if (f.size > 10 * 1000 * 1000) {
        showPop('文件过大', 'failed')
        return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
        const res = e.target?.result?.toString()
        if (!res) {
            showPop('文件读取失败', 'failed')
            return
        }
        try {
            const obj = JSON.parse(res) as Save
            jsonSaveStaCount.value = saveStaCount(obj)
            jsonSaveLineCount.value = saveLineCount(obj)
            jsonContent.value = JSON.stringify(obj)
            jsonLastModified.value = new Date(f.lastModified).toLocaleString() || ''
        } catch {
            showPop('文件格式异常', 'failed')
            resetReplaceJson()
        }
    }
    reader.readAsText(f)
}

async function commitReplaceJson() {
    if (!editingSave.value || !jsonContent.value)
        return
    const id = editingSave.value.id
    const data = jsonContent.value
    const staCount = jsonSaveStaCount.value || 0
    const lineCount = jsonSaveLineCount.value || 0
    const resp = await api.save.updateData(id, true, data, staCount, lineCount, false)
    if (resp) {
        showPop('替换成功\n下次保存更新略缩图', 'success')
        resetDangerZone()
        if (jsonFileInput.value) {
            jsonFileInput.value.value = ''
        }
    }
}

function resetReplaceJson() {
    jsonSaveLineCount.value = undefined
    jsonSaveStaCount.value = undefined
    jsonContent.value = undefined
}

function resetDangerZone() {
    resetReplaceJson()
    dangerZone.value = false
    repeatCvsName.value = ''
}

async function downloadJson() {
    if (!editingSave.value)
        return
    const json = await api.save.loadData(editingSave.value.id, false)
    if (json) {
        fileDownload(json, `${editingSave.value.name}.aarc.json`)
        showPop('已开始下载', 'success')
    }
}

const authGrantSb = useTemplateRef('authGrantSb')
const backupSb = useTemplateRef('backupSb')
const rcConvert = useTemplateRef('rcConvert')
const commentShow = ref(false)
const commentSaveId = ref<number>(0)
function openComment(s: SaveDto) {
    commentSaveId.value = s.id || 0
    commentShow.value = true
}

// 目录管理
const myFolders = ref<SaveFolderDto[]>([])
const saveFolderIds = ref<number[]>([])
const showFolderSelect = ref(false)

async function loadFolderInfo() {
    if (!editingSave.value || isCreatingSave.value) return
    const [folders, folderIds] = await Promise.all([
        api.saveFolder.getAllMyFolders(),
        api.saveFolder.getFolderIdsOfSave(editingSave.value.id)
    ])
    myFolders.value = folders || []
    saveFolderIds.value = folderIds || []
}

const currentFolders = computed(() => {
    return myFolders.value.filter(f => saveFolderIds.value.includes(f.id || 0))
})

async function removeSaveFromFolderInSidebar(folderId: number) {
    if (!editingSave.value) return
    const res = await api.saveFolder.removeSaveFromFolder(editingSave.value.id, folderId)
    if (res) {
        showPop('已移出', 'success')
        await loadFolderInfo()
        emit('refresh')
    }
}

async function addSaveToFolderInSidebar(folder: SaveFolderDto | undefined) {
    showFolderSelect.value = false
    if (!folder || !folder.id || !editingSave.value) return
    if (saveFolderIds.value.includes(folder.id)) {
        showPop('存档已在该目录中', 'failed')
        return
    }
    const res = await api.saveFolder.addSaveToFolder(editingSave.value.id, folder.id)
    if (res) {
        showPop('移入成功', 'success')
        await loadFolderInfo()
        emit('refresh')
    }
}

defineExpose({ startCreating })
</script>

<template>
    <div style="overflow-x: auto;">
        <table v-if="saves" class="fullWidth index saveList">
            <tbody>
                <tr>
                    <th style="width: 100px;min-width: 100px">点击进入</th>
                    <th style="min-width: 200px;">
                        名称
                        <span class="introNote">简介点击展开</span>
                    </th>
                    <th style="width: 130px;min-width: 130px">上次更新</th>
                    <th style="width: 100px;min-width: 100px"></th>
                </tr>
                <tr v-for="(s, idx) in (folderMode ? localSaves : saves)" :key="s.id">
                    <td>
                        <SaveAvatar :s="s" :definitely-editable="isMine"></SaveAvatar>
                    </td>
                    <td>
                        {{ s.name }}
                        <div v-if="s.intro" class="itemIntro" :class="{ nowrapEllipsis: !s.introShow }"
                            @click="s.introShow = !s.introShow">
                            {{ s.intro }}
                        </div>
                        <div class="dataInfo">—{{ s.lineCount }}线 {{ s.staCount }}站—</div>
                    </td>
                    <td>
                        <div class="lastActive">{{ s.lastActive }}</div>
                    </td>
                    <td>
                        <button v-if="isMine" class="minor" @click="startEditingInfo(s)">信息设置</button>
                        <button v-else-if="showFork && s.allowRequesterFork" class="minor" @click="$emit('fork', s.id)">另存为我的</button>
                        <div class="other-ops">
                            <template v-if="extraAction">
                                <button v-for="action in extraAction" :key="action.label" class="lite" @click="action.onClick(s)">
                                    {{ action.label }}
                                </button>
                            </template>
                            <button v-if="folderMode && orderBy === 'custom' && idx > 0" class="lite" @click="moveUp(idx)">上移</button>
                        </div>
                    </td>
                </tr>
                <tr v-if="saves.length == 0" style="color: #666; font-size: 16px;">
                    <td colspan="4">暂无存档</td>
                </tr>
            </tbody>
        </table>
        <Loading v-else></Loading>
    </div>

    <button v-if="folderMode && orderDirty" class="save-order-btn" @click="saveOrder">保存顺序</button>

    <SideBar ref="saveInfoSb" @extend="resetDangerZone" class="saveInfoSb">
        <h1>{{ isCreatingSave ? '创建存档' : '信息设置' }}</h1>
        <table v-if="editingSave">
            <tbody>
                <tr>
                    <td colspan="2">
                        <img :src="editingSave.miniUrl || defaultMini" class="miniInSidebar" />
                    </td>
                </tr>
                <tr>
                    <td>名称</td>
                    <td>
                        <input v-model="editingSave.name" />
                    </td>
                </tr>
                <tr>
                    <td>简介</td>
                    <td>
                        <textarea v-model="editingSave.intro" placeholder="最多256字符" rows="5"></textarea>
                    </td>
                </tr>
                <tr v-if="!isCreatingSave">
                    <td>留言</td>
                    <td>
                        <button class="lite confirm" @click="editingSave && openComment(editingSave)">打开留言</button>
                    </td>
                </tr>
                <tr v-if="!isCreatingSave">
                    <td>权限</td>
                    <td>
                        <button class="lite confirm" @click="authGrantSb?.extend">打开权限设置栏</button>
                    </td>
                </tr>
                <tr v-if="!isCreatingSave">
                    <td>记录</td>
                    <td>
                        <RouterLink :to="saveDiffsRoute(editingSave.id)" target="_blank" class="confirm">前往访客编辑记录页</RouterLink>
                    </td>
                </tr>
                <tr v-if="!isCreatingSave">
                    <td>备份</td>
                    <td>
                        <button class="lite confirm" @click="backupSb?.extend">打开备份列表</button>
                    </td>
                </tr>
                <tr v-if="!isCreatingSave">
                    <td>所属目录</td>
                    <td>
                        <div v-if="currentFolders.length > 0" class="folder-belong-list">
                            <div v-for="f in currentFolders" :key="f.id" class="folder-belong-item">
                                <span class="folder-name">{{ f.name }}</span>
                                <button class="lite danger-text" @click="f.id && removeSaveFromFolderInSidebar(f.id)">移出</button>
                            </div>
                        </div>
                        <div v-else class="folder-belong-empty">未归入任何目录</div>
                        <button class="lite confirm" @click="showFolderSelect = true">+ 添加到目录</button>
                        <FolderSelect v-if="showFolderSelect" :exclude-ids="saveFolderIds"
                            @select="addSaveToFolderInSidebar" @loaded="myFolders = $event">
                        </FolderSelect>
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                        <button @click="done">{{ isCreatingSave ? '创建存档' : '保存更改' }}</button>
                    </td>
                </tr>
            </tbody>
        </table>
        <table v-if="!isCreatingSave">
            <tbody>
                <tr>
                    <td>
                        <button class="minor downloadJsonBtn" @click="downloadJson">导出工程文件</button>
                    </td>
                </tr>
                <tr>
                    <td>
                        <button class="downloadJsonBtn rcConvertBtn" @click="rcConvert?.extend()">转换为轨交棋棋盘</button>
                    </td>
                </tr>
            </tbody>
        </table>
        <table v-if="!isCreatingSave">
            <tbody>
                <tr>
                    <td>
                        <button class="minor dangerZoneBtn" @click="dangerZone = !dangerZone">删除/导入</button>
                        <div v-show="dangerZone" class="dangerZone">
                            <div class="dangerOpName">
                                替换存档数据
                            </div>
                            <input type="file" ref="jsonFileInput" accept=".json" @change="selectReplaceJson" />
                            <div v-show="jsonContent" class="replaceJsonInfo">
                                <b>—{{ jsonSaveLineCount }}线 {{ jsonSaveStaCount }}站—</b><br />
                                <b>更新于 {{ jsonLastModified }}</b><br />
                                存档数据将被覆盖<br />
                                注意核对
                            </div>
                            <button v-show="jsonContent" class="danger" @click="commitReplaceJson">替换数据</button>
                        </div>
                        <div v-show="dangerZone" class="dangerZone">
                            <div class="dangerOpName">删除存档</div>
                            <input v-model="repeatCvsName" placeholder="输入本存档名称" />
                            <button v-show="repeatCvsName" class="danger" @click="removeCurrentCvs">删除存档</button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </SideBar>
    <CommentList v-if="commentShow" :save-id="commentSaveId" :is-owner="isMine" @close="commentShow = false"></CommentList>
    <SideBar ref="authGrantSb">
        <h1>授权管理</h1>
        <template v-if="editingSave?.id">
            <SwitchingTabs :texts="['查看', '编辑', '另存']">
                <AuthGrantEdit :on="AuthGrantOn.Save" :on-id="editingSave.id" :type="AuthGrantTypeOfSave.View" />
                <AuthGrantEdit :on="AuthGrantOn.Save" :on-id="editingSave.id" :type="AuthGrantTypeOfSave.Edit" />
                <AuthGrantEdit :on="AuthGrantOn.Save" :on-id="editingSave.id" :type="AuthGrantTypeOfSave.Fork" />
            </SwitchingTabs>
            <div class="smallNote globalAgNote">
                注：可以在"顶部栏-用户-个人授权管理"中配置自己的全局默认设置，此处的设置仅对当前存档有效（判断时优先于全局设置）
            </div>
        </template>
    </SideBar>
    <SideBar ref="backupSb">
        <h1>备份列表</h1>
        <template v-if="editingSave?.id">
            <SaveBackups :save-id="editingSave.id"></SaveBackups>
        </template>
    </SideBar>
    <ConvertToRailChess ref="rcConvert" v-if="editingSave" :save="editingSave" />
</template>

<style scoped lang="scss">
.miniInSidebar {
    border-radius: 10px;
    height: 160px;
    width: 160px;
}

.saveInfoSb {
    input, textarea {
        width: 180px;
    }

    table {
        width: 100%;
        margin-bottom: 10px;
    }

    .downloadJsonBtn {
        display: block;
        margin: auto;
    }

    .rcConvertBtn {
        background: linear-gradient(to right, #33BDB6, #8F98F2);
        color: white;
    }

    .replaceJsonInfo {
        text-align: center;
        font-size: 14px;
        color: #333
    }

    .dangerZoneBtn {
        display: block;
        margin: auto;
    }

    .dangerOpName {
        text-align: center;
        color: red;
    }
}

.globalAgNote {
    margin-top: 10px;
}

.folder-belong-list {
    margin-bottom: 8px;

    .folder-belong-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 6px;
        border-radius: 4px;
        background-color: #f5f5f5;
        margin-bottom: 4px;

        .folder-name {
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 120px;
        }

        button {
            font-size: 12px;
            padding: 2px 6px;
        }
    }
}

.folder-belong-empty {
    color: #999;
    font-size: 14px;
    margin-bottom: 8px;
}

.save-order-btn {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    font-size: 16px;
    padding: 8px 24px;
    background-color: cornflowerblue;
    color: white;
    border: none;
    border-radius: 20px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    cursor: pointer;
    animation: saveOrderPulse 0.5s ease-in-out infinite alternate;

    &:hover {
        background-color: #4a7fd4;
        animation-play-state: paused;
    }
}

@keyframes saveOrderPulse {
    from {
        background-color: cornflowerblue;
    }
    to {
        background-color: #2a5db0;
    }
}
</style>
