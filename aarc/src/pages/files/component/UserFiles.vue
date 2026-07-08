<script lang="ts" setup>
import { ref } from 'vue';
import { UserFileDto, UserFavoriteType, AuthGrantOn, AuthGrantTypeOfUserFile } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import UserFavoriteStar from '@/pages/components/UserFavoriteStar.vue';
import AuthGrantEdit from '@/pages/components/AuthGrantEdit.vue';
import SideBar from '@/components/common/SideBar.vue';
import { isSvg } from '@/utils/fileUtils/ext';
import copy from 'copy-to-clipboard';
import linkIcon from '@/assets/ui/chain.svg';
import settingsIcon from '@/assets/ui/gear.svg';

const props = defineProps<{
    files: UserFileDto[],
    emptyText?: string,
    allowEdit?: boolean
}>()

const emit = defineEmits<{
    updated: []
}>()

const api = useApiStore()
const { showPop } = useUniqueComponentsStore()
const urlBase = import.meta.env.VITE_ApiUrlBase

const editSidebar = ref<InstanceType<typeof SideBar>>()
const editingFile = ref<UserFileDto>()
const editingName = ref('')
const editingIntro = ref('')

function copyImageLink(file: UserFileDto) {
    const domain = window.location.origin;
    const imageUrl = `${domain}${file.urlOriginal}`;
    const success = copy(imageUrl);
    if (success) {
        showPop('已复制链接', 'success');
    } else {
        showPop('链接复制失败，请改用正规浏览器', 'failed');
    }
}

function startEditing(file: UserFileDto) {
    editingFile.value = file
    editingName.value = file.displayName || ''
    editingIntro.value = file.intro || ''
    editSidebar.value?.extend()
}

async function doneEditing() {
    if (!editingFile.value) return
    const res = await api.userFile.edit(editingFile.value.id ?? 0, editingName.value, editingIntro.value)
    if (res) {
        showPop('保存成功', 'success')
        editSidebar.value?.fold()
        emit('updated')
    }
}

function deleteFile() {
    const id = editingFile.value?.id
    if (!id) return
    if (!window.confirm('删除资源后，使用它的画布将无法再正常加载它，是否继续？'))
        return
    api.userFile.delete(id).then((res) => {
        if (res) {
            showPop('删除成功', 'success')
            editSidebar.value?.fold()
            emit('updated')
        }
    })
}
</script>

<template>
    <div v-if="files.length === 0" class="empty-state">
        <p>{{ emptyText ?? '暂无资源' }}</p>
    </div>
    <div v-else class="file-list">
        <div v-for="file in files" :key="file.id" class="file-item">
            <div class="file-preview">
                <div v-if="isSvg(file.storeName) && Number(file.size) > 100*1000" class="svg-placeholder">
                    <span class="svg-icon">SVG</span>
                </div>
                <img v-else
                  :src="urlBase + file.urlThumb" 
                  :alt="file.displayName" 
                  class="preview-image" 
                  loading="lazy"
                />
            </div>
            <div class="file-info">
                <h3 class="file-name">{{ file.displayName || '未命名文件' }}</h3>
                <div class="file-footer">
                    <div class="file-owner">
                        {{ file.ownerUserName || '未知用户' }}
                    </div>
                    <div class="file-op">
                        <img :src="linkIcon" @click="copyImageLink(file)" title="复制原图片链接" />
                        <UserFavoriteStar
                            class="file-op-fav-star"
                            :type="UserFavoriteType.UserFile"
                            :objectId="file.id!"
                            :isFavorited="file.isFavorited"
                            @updated="(val) => { file.isFavorited = val }"
                        />
                        <img v-if="allowEdit !== false" :src="settingsIcon" @click="startEditing(file)" title="编辑"/>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <SideBar ref="editSidebar">
        <h1>编辑资源</h1>
        <table class="fullWidth"><tbody>
            <tr>
                <td>名称</td>
                <td>
                    <input v-model="editingName" />
                </td>
            </tr>
            <tr>
                <td>简介</td>
                <td>
                    <input v-model="editingIntro" />
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <button @click="doneEditing">确认</button>
                </td>
            </tr>
        </tbody></table>
        <h1 style="margin-top: 30px;">授权管理</h1>
        <div class="auth-grant-section">
            <AuthGrantEdit :on="AuthGrantOn.UserFile" :on-id="editingFile?.id ?? 0" :type="AuthGrantTypeOfUserFile.View"/>
            <div class="smallNote">
                注：此处设置仅对当前资源有效，如果需要对全部资源生效，请使用“顶部栏-用户-资源授权管理”
            </div>
        </div>
        <div class="delete-btn-container">
            <button @click="deleteFile" class="minor">删除资源</button>
        </div>
    </SideBar>
</template>

<style scoped lang="scss">
.empty-state {
    text-align: center;
    padding: 60px 0px;
    color: #666;
    p{
        margin-bottom: 10px;
    }
}

.file-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}

.file-item {
    width: 200px;
    height: 200px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.file-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.file-preview {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    overflow: hidden;
}

.file-op-fav-star {
    :deep(.user-favorite-star) {
        width: 16px;
        height: 16px;
        padding: 0;
    }
}

.preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.svg-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
}

.svg-icon {
    font-size: 14px;
    font-weight: bold;
    color: #666;
    padding: 4px 8px;
    border: 2px solid #666;
    border-radius: 4px;
}

.file-info {
    padding: 7px;
    text-align: center;
    background-color: #fff;
    height: 65px;
    box-sizing: border-box;
}

.file-name {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-footer{
    display: flex;
    justify-content: space-between;
    align-items: center;
    .file-owner {
        margin: 0;
        font-size: 12px;
        color: #B3B3B3;
        max-width: calc(100% - 50px);
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }
    .file-op{
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        img{
            width: 16px;
            height: 16px;
            object-fit: contain;
            cursor: pointer;
            flex-shrink: 0;
        }
    }
}

.delete-btn-container {
    display: flex;
    justify-content: center;
    margin-top: 30px;
}

.auth-grant-section {
    margin-top: 10px;
    .smallNote {
        margin-top: 10px;
        font-size: 14px;
    }
}

@media (max-width: 768px) {
    .file-list{
        justify-content: space-between;
        row-gap: 14px;
        column-gap: 0px;
    }
    .file-item {
        width: calc((100% - 14px) / 2);
        height: 200px;
    }
}
</style>
