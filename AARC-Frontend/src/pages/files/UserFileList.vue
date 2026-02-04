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

const fileList = ref<UserFileDto[]>();
const api = useApiStore()
const { showPop } = useUniqueComponentsStore()
const { userInfo } = useUserInfoStore()
const urlBase = import.meta.env.VITE_ApiUrlBase

async function loadFileList(){
    fileList.value = undefined
    const res = await api.userFile.get()
    if(res){
        fileList.value = res
    }
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
        await loadFileList()
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
            loadFileList()
        }
    })
}

onMounted(async() => {
    await loadFileList();
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
        <Loading v-if="!fileList"></Loading>
        <div v-else-if="fileList.length === 0" class="empty-state">
            <p>暂无文件</p>
        </div>
        <div v-else class="file-list">
            <div v-for="file in fileList" :key="file.id" class="file-item">
                <div class="file-preview">
                    <!-- 为图片添加id -->
                    <img 
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
        <div class="beta-notice">
            新功能测试完善中，遇到问题请及时联系管理员。
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
.beta-notice{
    color: #666;
    text-align: center;
    margin: 20px 0px;
    font-size: 14px;
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