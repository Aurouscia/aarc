<script setup lang="ts">
import { ref, computed } from 'vue';
import { UserFileType } from '@/app/com/apiGenerated';
import { useApiStore } from '@/app/com/apiStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { dataSizeStr } from '@/utils/fileUtils/dataSizeStr';
import SideBar from '../SideBar.vue';

const props = defineProps<{
    type: UserFileType;
    onSuccess?: () => void;
}>();

const api = useApiStore();
const { showPop } = useUniqueComponentsStore();

const sidebarRef = ref<InstanceType<typeof SideBar>>();

const file = ref<File>();
const displayName = ref('');
const uploading = ref(false);
const isDragging = ref(false);

const fileSizeStr = computed(() =>
    file.value ? dataSizeStr(file.value.size) : '-'
);

function open() {
    reset();
    sidebarRef.value?.extend();
}

function close() {
    sidebarRef.value?.fold();
}

function reset() {
    file.value = undefined;
    displayName.value = '';
}

function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        onFileSelected(input.files[0]);
    }
}

function onFileSelected(selected: File) {
    file.value = selected;
    displayName.value = selected.name;
}

function handleDrop(e: DragEvent) {
    isDragging.value = false;
    e.preventDefault();
    if (e.dataTransfer?.files.length) {
        onFileSelected(e.dataTransfer.files[0]);
    }
}

function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging.value = true;
}

function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging.value = false;
}

function openFileInput() {
    document.getElementById('genericFileUploadInput')?.click();
}

async function upload() {
    if (!file.value) {
        showPop('请先选择文件', 'failed');
        return;
    }
    if (!displayName.value.trim()) {
        showPop('请输入显示名称', 'failed');
        return;
    }
    uploading.value = true;
    try {
        const res = await api.userFile.upload(
            { data: file.value, fileName: file.value.name },
            undefined,
            displayName.value.trim(),
            undefined,
            props.type
        );
        if (res) {
            showPop('上传成功', 'success');
            close();
            reset();
            props.onSuccess?.();
        } else {
            showPop('上传失败', 'failed');
        }
    } catch (err) {
        showPop(
            err instanceof Error ? err.message : '上传失败',
            'failed'
        );
        console.error(err);
    } finally {
        uploading.value = false;
    }
}

defineExpose({ open, close });
</script>

<template>
    <SideBar ref="sidebarRef">
        <div class="genericFileUpload">
            <h1>上传文件</h1>
            <div
                class="dropZone"
                :class="{ dragging: isDragging }"
                @click="openFileInput"
                @drop="handleDrop"
                @dragover="handleDragOver"
                @dragleave="handleDragLeave"
            >
                <input
                    id="genericFileUploadInput"
                    type="file"
                    accept="application/json"
                    @change="handleFileChange"
                />
                <div class="dropZoneText">
                    <span>点击或拖动 JSON 文件到此处</span>
                </div>
            </div>

            <div v-if="file" class="fileInfo">
                <div class="infoRow">
                    <span class="label">文件：</span>
                    <span class="value fileName" :title="file.name">{{ file.name }}</span>
                </div>
                <div class="infoRow">
                    <span class="label">大小：</span>
                    <span class="value">{{ fileSizeStr }}</span>
                </div>
            </div>

            <div class="inputRow">
                <label>显示名称</label>
                <input v-model="displayName" placeholder="输入显示名称" />
            </div>

            <button
                class="uploadBtn"
                :disabled="uploading || !file"
                @click="upload"
            >
                {{ uploading ? '上传中…' : '上传' }}
            </button>
        </div>
    </SideBar>
</template>

<style scoped lang="scss">
.genericFileUpload {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.dropZone {
    border: 2px dashed #aaa;
    border-radius: 8px;
    padding: 30px 10px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
    color: #666;
    input[type='file'] {
        display: none;
    }
    &.dragging {
        border-color: cornflowerblue;
        background-color: #f0f6ff;
        color: cornflowerblue;
    }
    &:hover {
        border-color: cornflowerblue;
        color: cornflowerblue;
    }
}

.dropZoneText {
    font-size: 14px;
    pointer-events: none;
}

.fileInfo {
    font-size: 13px;
    color: #333;
    .infoRow {
        display: flex;
        gap: 6px;
        margin-bottom: 4px;
    }
    .label {
        color: #666;
        white-space: nowrap;
    }
    .fileName {
        word-break: break-all;
    }
}

.inputRow {
    display: flex;
    flex-direction: column;
    gap: 4px;
    label {
        font-size: 13px;
        color: #666;
    }
    input {
        width: 100%;
        margin: 0;
        box-sizing: border-box;
    }
}

.uploadBtn {
    width: 100%;
    margin: 0;
}

h1 {
    text-align: center;
    padding: 0px 0px 4px;
    margin: 6px 0px 4px;
    font-size: 20px;
    font-weight: bold;
    border-bottom: none;
}
</style>
