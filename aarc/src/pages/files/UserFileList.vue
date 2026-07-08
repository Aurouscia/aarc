<script lang="ts" setup>
import { ref, onMounted, useTemplateRef, watch } from 'vue';
import { UserFileDto, UserFileType } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import Loading from '@/components/common/Loading.vue';
import UserFileUpload from '@/components/common/userFile/UserFileUpload.vue';
import { useUserInfoStore } from '@/app/globalStores/userInfo';
import { useUserFileListLocalConfigStore } from '@/app/localConfig/userFileListLocalConfig';
import UserFiles from './component/UserFiles.vue';

const fileList = ref<UserFileDto[]>()
const api = useApiStore()
const { userInfo } = useUserInfoStore()
const userFileListLocalConfig = useUserFileListLocalConfigStore()

const pageSize = 50
const skip = ref(0)
const noMore = ref(false)
const loadingMore = ref(false)
const search = ref('')
const activeSearch = ref('')
const prefixes = ref<string[]>([])
const selectedPrefix = ref('')
const orderby = ref(userFileListLocalConfig.orderby)

async function loadFileList(reset = false){
    if(reset){
        fileList.value = undefined
        skip.value = 0
        noMore.value = false
        activeSearch.value = search.value
    }
    const res = await api.userFile.get(skip.value, pageSize, activeSearch.value || undefined, orderby.value)
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

async function loadPrefixes() {
    const res = await api.userFile.getPrefixes()
    if(res){
        prefixes.value = res
    }
}

watch(selectedPrefix, (newVal, oldVal) => {
    if(newVal !== oldVal){
        search.value = newVal ? newVal + '-' : ''
        loadFileList(true)
    }
})

watch(search, (newVal, oldVal) => {
    if(newVal !== oldVal){
        // 如果搜索框内容不再以当前选中的prefix开头，重置select
        const prefix = selectedPrefix.value
        if(prefix && !newVal.startsWith(prefix + '-')){
            selectedPrefix.value = ''
        }
    }
})

const uploadSidebar = useTemplateRef('uploadSidebar')

function startCreating(){
    uploadSidebar.value?.open()
}

function onUploadSuccess(){
    loadFileList(true)
}

onMounted(async() => {
    await loadFileList(true);
    await loadPrefixes();
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
            <select v-model="orderby" @change="userFileListLocalConfig.orderby = orderby; loadFileList(true)">
                <option value="time">更新</option>
                <option value="name">名称</option>
            </select>
            <select v-model="selectedPrefix">
                <option value="">全部</option>
                <option v-for="prefix in prefixes" :key="prefix" :value="prefix">{{ prefix }}</option>
            </select>
            <input v-model="search" @input="selectedPrefix = ''" @blur="loadFileList(true)" @keyup.enter="loadFileList(true)" placeholder="搜索资源名" />
        </div>
        <Loading v-if="!fileList"></Loading>
        <UserFiles
            v-else
            :files="fileList"
            :empty-text="activeSearch ? '未搜索到相关资源' : '暂无资源'"
            :allow-edit="true"
            @updated="loadFileList(true)"
        />
        <div v-if="fileList && fileList.length > 0" class="load-more">
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
    <UserFileUpload ref="uploadSidebar" :type="UserFileType.Icon" :on-success="onUploadSuccess" />
</template>

<style scoped lang="scss">
.search-bar{
    display: flex;
    justify-content: flex-end;
    margin: 10px 0px;
    gap: 8px;
    select {
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    input{
        width: 120px;
    }
    select, input {
        margin-left: 0px;
        margin-right: 0px;
    }
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
}
</style>
