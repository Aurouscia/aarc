<script lang="ts" setup>
import { ref, onMounted, useTemplateRef } from 'vue';
import { UserFileDto } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import Loading from '@/components/common/Loading.vue';
import SideBar from '@/components/common/SideBar.vue';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import linkIcon from '@/assets/ui/chain.svg';
import settingsIcon from '@/assets/ui/gear.svg';
import copy from 'copy-to-clipboard';
import Notice from '@/components/common/Notice.vue';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { isSvg } from '@/utils/fileUtils/ext';

const fileList = ref<UserFileDto[]>();
const api = useApiStore()
const { showPop } = useUniqueComponentsStore()
const { userInfo } = useUserInfoStore()
const urlBase = import.meta.env.VITE_ApiUrlBase

const pageSize = 50
const skip = ref(0)
const noMore = ref(false)
const loadingMore = ref(false)
const search = ref('')
const activeSearch = ref('')

async function loadFileList(reset = false){
    if(reset){
        fileList.value = undefined
        skip.value = 0
        noMore.value = false
        activeSearch.value = search.value
    }
    const res = await api.userFile.get(skip.value, pageSize, activeSearch.value || undefined)
    if(res){
        if(reset || !fileList.value){
            fileList.value = res
        }else{
            fileList.value.push(...res)
        }
        if(res.length < pageSize){
            noMore.value = true
        }
        skip.value += res.length
    }
}

async function loadMore(){
    if(loadingMore.value || noMore.value) return
    loadingMore.value = true
    await loadFileList()
    loadingMore.value = false
}

const sidebar = useTemplateRef('sidebar')
const isCreating = ref(false)
const editingId = ref(0)
const editingName = ref('')
const editingIntro = ref('')
const editingFile = ref<File>()
function handleFileChange(e: Event){
    const input = e?.target as HTMLInputElement|undefined
    if(input?.files && input.files.length > 0){
        editingFile.value = input.files[0]
    }
}

function startCreating(){
    resetEditing()
    isCreating.value = true
    sidebar.value?.extend()
}
function startEditing(dto: UserFileDto){
    resetEditing()
    isCreating.value = false
    editingId.value = dto.id || 0
    editingName.value = dto.displayName || ''
    editingIntro.value = dto.intro || ''
    sidebar.value?.extend()
}

async function done(){
    let res: boolean|undefined
    if(isCreating.value){
        if(!editingFile.value){
            showPop('请选择文件', 'failed')
            return
        }
        res = await api.userFile.upload({
            fileName: editingFile.value.name, data: editingFile.value
        }, editingName.value, editingIntro.value)
    }
    else
    {
        res = await api.userFile.edit(editingId.value, editingName.value, editingIntro.value)
    }
    if(res){
        resetEditing()
        showPop('上传成功', 'success')
        sidebar.value?.fold()
        await loadFileList(true)
    }
}
function resetEditing(){
    editingId.value = 0
    editingName.value = ''
    editingIntro.value = ''
    editingFile.value = undefined
}

function copyImageLink(file: UserFileDto) {
    // 获取当前域名
    const domain = window.location.origin;
    // 构建图片链接
    const imageUrl = `${domain}${file.urlOriginal}`;
    const success = copy(imageUrl);
    if (success) {
        showPop('已复制链接', 'success');
    } else {
        showPop('链接复制失败，请改用正规浏览器', 'failed');
    }
}

function deleteFile(fileId:number){
    if(!fileId)
        return
    if(!window.confirm('删除资源后，使用它的画布将无法再正常加载它，是否继续？'))
        return
    api.userFile.delete(fileId).then((res)=>{
        if(res){
            showPop('删除成功','success')
            sidebar.value?.fold()
            loadFileList(true)
        }
    })
}

onMounted(async() => {
    await loadFileList(true);
})
</script>

<template>
    <h1 class="h1WithBtns">
        资源库
        <div v-if="!userInfo.isTourist">
            <button @click="startCreating">新上传</button>
        </div>
    </h1>
    <div v-if="!userInfo.isTourist" class="user-file-list-container">
        <div class="search-bar">
            <input v-model="search" @blur="loadFileList(true)" @keyup.enter="loadFileList(true)" placeholder="搜索资源名" />
        </div>
        <Loading v-if="!fileList"></Loading>
        <div v-else-if="fileList.length === 0" class="empty-state">
            <p>{{ activeSearch ? '未搜索到相关资源' : '暂无资源' }}</p>
        </div>
        <div v-else class="file-list">
            <div v-for="file in fileList" :key="file.id" class="file-item">
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
                            <!-- 为链接图标添加点击事件 -->
                            <img :src="linkIcon" @click="copyImageLink(file)" title="复制原图片链接" />
                            <img :src="settingsIcon" @click="startEditing(file)"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="load-more">
            <button v-if="!noMore" @click="loadMore" :disabled="loadingMore">
                {{ loadingMore ? '加载中...' : '加载更多' }}
            </button>
            <span v-else class="no-more">
                {{ activeSearch ? `没有更多关于"${activeSearch}"的了` : '没有更多了' }}
                <button v-if="activeSearch" class="lite" @click="search='';loadFileList(true)">清空搜索</button>
            </span>
        </div>
    </div>
    <div v-else class="user-file-list-container">
        <div class="empty-state">
            <p>为确保内容合规性，游客用户无法上传资源</p>
            <p>
                请确保已登录且转正为“正式用户”，如何转正参考“注册”页面的说明。
            </p>
            <p>
                但是：游客用户可使用其他人上传并选择公开的资源，敬请期待后续更新。
            </p>
        </div>
    </div>
    <SideBar ref="sidebar">
        <h1>{{ isCreating? '上传资源' : '编辑资源' }}</h1>
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
            <tr v-if="isCreating">
                <td colspan="2">
                    <input type="file" @change="handleFileChange" accept="png, jpg, jpeg, svg, webp" placeholder="选择文件"/>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <button @click="done">确认</button>
                </td>
            </tr>
        </tbody></table>
        <Notice v-if="isCreating" :title="'用法'" type="info">
            <div class="create-notice">
                <p>完成创建后，点击链接图标复制图片链接，然后在编辑器设置中粘贴使用。</p>
                <p>更方便的使用方式敬请期待更新。</p>
                <p>如果图片过大，请使用 <a href="https://imageresizer.com/">https://imageresizer.com</a> 缩小你的图片到限制以下。</p>
            </div>
        </Notice>
        <div v-if="!isCreating" class="delete-btn-container">
            <button @click="deleteFile(editingId)" class="minor">删除资源</button>
        </div>
    </SideBar>
</template>

<style scoped lang="scss">
.search-bar{
    display: flex;
    justify-content: flex-end;
    margin: 10px 0px;
}
.load-more{
    text-align: center;
    margin: 20px 0px;
    .no-more{
        color: #999;
        font-size: 14px;
    }
}
.create-notice{
    display: flex;
    flex-direction: column;
    gap: 10px;
    p{
        text-indent: 1em;
    }
    a{
        color: inherit;
        text-decoration: underline;
    }
}

.user-file-list-container{
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
        padding: 10px;
        text-align: center;
        background-color: #fff;
        height: 65px;
        box-sizing: border-box;
    }

    .file-name {
        margin: 0 0 5px 0;
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
            gap: 6px;
            img{
                width: 16px;
                height: 16px;
                object-fit: contain;
                cursor: pointer;
            }
        }
    }

    /* 响应式设计 */
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
}

.delete-btn-container {
    display: flex;
    justify-content: center;
    margin-top: 30px;
}
</style>