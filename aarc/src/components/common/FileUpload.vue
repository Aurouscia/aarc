<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue';
import { resizeImage } from '@aurouscia/image-compress';
import { dataSizeStr } from '@/utils/fileUtils/dataSizeStr';
import { debounce } from '@/utils/lang/debounce';
import { useApiStore } from '@/app/com/apiStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { UserFileType } from '@/app/com/apiGenerated';
import SideBar from './SideBar.vue';

const props = defineProps<{
    onSuccess?: () => void;
}>();

const api = useApiStore();
const { showPop } = useUniqueComponentsStore();

const sidebarRef = ref<InstanceType<typeof SideBar>>();
const file = ref<File>();
const displayName = ref('');
const isDragging = ref(false);
const originalUrl = ref<string>();
const processedUrl = ref<string>();
const processedBlob = ref<Blob>();
const processedSizeStr = ref<string>('-');
const thumbUrl = ref<string>();
const thumbBlob = ref<Blob>();
const thumbSizeStr = ref<string>('-');
const originalWidth = ref(0);
const originalHeight = ref(0);
const width = ref(256);
const height = ref(256);
const quality = ref(0.5);
const processing = ref(false);
const thumbProcessing = ref(false);
const uploading = ref(false);
const processError = ref<string>();

const originalSizeStr = computed(() =>
    file.value ? dataSizeStr(file.value.size) : '-'
);

let skipNextHeightUpdate = false;
let skipNextWidthUpdate = false;

async function processImage() {
    if (!file.value) return;
    processing.value = true;
    processError.value = undefined;
    try {
        const { blob } = await resizeImage(file.value, {
            maxWidth: width.value,
            maxHeight: height.value,
            type: 'image/webp',
            quality: quality.value
        });
        processedBlob.value = blob;
        processedSizeStr.value = dataSizeStr(blob.size);
        if (processedUrl.value) URL.revokeObjectURL(processedUrl.value);
        processedUrl.value = URL.createObjectURL(blob);
    } catch (err) {
        processedBlob.value = undefined;
        processedSizeStr.value = '处理失败';
        processError.value =
            err instanceof Error ? err.message : '图片处理失败';
        console.error(err);
    } finally {
        processing.value = false;
    }
}

async function processThumb() {
    if (!file.value) return;
    thumbProcessing.value = true;
    try {
        const { blob } = await resizeImage(file.value, {
            maxWidth: 256,
            maxHeight: 256,
            type: 'image/webp',
            quality: 0.5
        });
        thumbBlob.value = blob;
        thumbSizeStr.value = dataSizeStr(blob.size);
        if (thumbUrl.value) URL.revokeObjectURL(thumbUrl.value);
        thumbUrl.value = URL.createObjectURL(blob);
    } catch (err) {
        thumbBlob.value = undefined;
        thumbSizeStr.value = '处理失败';
        console.error(err);
    } finally {
        thumbProcessing.value = false;
    }
}

const debouncedProcessImage = debounce(processImage, 200);

watch(width, () => {
    if (skipNextWidthUpdate) {
        skipNextWidthUpdate = false;
        return;
    }
    if (!originalWidth.value || !originalHeight.value) return;
    skipNextHeightUpdate = true;
    height.value = Math.round(
        (width.value * originalHeight.value) / originalWidth.value
    );
    debouncedProcessImage();
});

watch(height, () => {
    if (skipNextHeightUpdate) {
        skipNextHeightUpdate = false;
        return;
    }
    if (!originalWidth.value || !originalHeight.value) return;
    skipNextWidthUpdate = true;
    width.value = Math.round(
        (height.value * originalWidth.value) / originalHeight.value
    );
    debouncedProcessImage();
});
watch(quality, debouncedProcessImage);

function initDimensions(imgWidth: number, imgHeight: number) {
    originalWidth.value = imgWidth;
    originalHeight.value = imgHeight;
    const max = Math.max(imgWidth, imgHeight);
    if (max <= 256) {
        width.value = imgWidth;
        height.value = imgHeight;
    } else {
        const ratio = 256 / max;
        width.value = Math.round(imgWidth * ratio);
        height.value = Math.round(imgHeight * ratio);
    }
}

function onFileSelected(selected: File) {
    if (originalUrl.value) URL.revokeObjectURL(originalUrl.value);
    if (processedUrl.value) URL.revokeObjectURL(processedUrl.value);
    if (thumbUrl.value) URL.revokeObjectURL(thumbUrl.value);
    file.value = selected;
    displayName.value = selected.name;
    originalUrl.value = URL.createObjectURL(selected);

    const img = new Image();
    img.onload = () => {
        let w = img.width;
        let h = img.height;
        // SVG 未声明尺寸时浏览器可能返回 0，与包内部默认值保持一致
        if (!w || !h) {
            w = 512;
            h = 512;
        }
        initDimensions(w, h);
        processImage();
        processThumb();
    };
    img.onerror = () => {
        processError.value = '无法读取图片';
    };
    img.src = originalUrl.value;
}

function handleFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        onFileSelected(input.files[0]);
    }
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
    document.getElementById('fileUploadInput')?.click();
}

function reset() {
    if (originalUrl.value) URL.revokeObjectURL(originalUrl.value);
    if (processedUrl.value) URL.revokeObjectURL(processedUrl.value);
    if (thumbUrl.value) URL.revokeObjectURL(thumbUrl.value);
    file.value = undefined;
    displayName.value = '';
    originalUrl.value = undefined;
    processedUrl.value = undefined;
    processedBlob.value = undefined;
    processedSizeStr.value = '-';
    thumbUrl.value = undefined;
    thumbBlob.value = undefined;
    thumbSizeStr.value = '-';
    originalWidth.value = 0;
    originalHeight.value = 0;
    width.value = 256;
    height.value = 256;
    quality.value = 0.5;
    processError.value = undefined;
}

function open() {
    reset();
    sidebarRef.value?.extend();
}

function close() {
    sidebarRef.value?.fold();
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
        const thumb = thumbBlob.value ?? processedBlob.value;
        const res = await api.userFile.upload(
            { data: file.value, fileName: file.value.name },
            thumb ? { data: thumb, fileName: 'thumb.webp' } : undefined,
            displayName.value.trim(),
            undefined,
            UserFileType.Icon
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

onUnmounted(() => {
    if (originalUrl.value) URL.revokeObjectURL(originalUrl.value);
    if (processedUrl.value) URL.revokeObjectURL(processedUrl.value);
    if (thumbUrl.value) URL.revokeObjectURL(thumbUrl.value);
});

defineExpose({ open });
</script>

<template>
    <SideBar ref="sidebarRef">
        <div class="fileUpload">
            <h1>上传资源</h1>
            <div
                class="dropZone"
                :class="{ dragging: isDragging }"
                @click="openFileInput"
                @drop="handleDrop"
                @dragover="handleDragOver"
                @dragleave="handleDragLeave"
            >
                <input
                    id="fileUploadInput"
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    @change="handleFileChange"
                />
                <div class="dropZoneText">
                    <span>点击或拖动文件到此处</span>
                </div>
            </div>

            <div v-if="file" class="fileInfo">
                <div class="infoRow">
                    <span class="label">文件：</span>
                    <span class="value fileName" :title="file.name">{{ file.name }}</span>
                </div>
                <div class="infoRow">
                    <span class="label">原图大小：</span>
                    <span class="value">{{ originalSizeStr }}</span>
                </div>
            </div>

            <div class="inputRow">
                <label>显示名称</label>
                <input v-model="displayName" placeholder="输入显示名称" />
            </div>

            <div v-if="file" class="controls">
                <div class="dimensionRow">
                    <div class="controlRow">
                        <label>宽</label>
                        <input
                            v-model.number="width"
                            type="number"
                            min="1"
                        />
                    </div>
                    <div class="controlRow">
                        <label>高</label>
                        <input
                            v-model.number="height"
                            type="number"
                            min="1"
                        />
                    </div>
                </div>
                <div class="ratioHint">已锁定长宽比</div>
                <div class="controlRow qualityRow">
                    <label>质量</label>
                    <input
                        v-model.number="quality"
                        type="range"
                        min="0.01"
                        max="1"
                        step="0.01"
                    />
                    <span class="qualityValue">{{ Math.round(quality * 100) }}%</span>
                </div>
            </div>

            <div v-if="processError" class="error">{{ processError }}</div>

            <div v-if="file" class="previews">
                <div class="previewBlock">
                    <div class="previewTitle">原图</div>
                    <img v-if="originalUrl" :src="originalUrl" alt="原图预览" />
                </div>
                <div class="previewBlock">
                    <div class="previewTitle">
                        处理后
                        <span v-if="processing" class="processing">处理中…</span>
                    </div>
                    <img
                        v-if="processedUrl"
                        :src="processedUrl"
                        alt="处理后预览"
                    />
                    <div class="processedSize">大小：{{ processedSizeStr }}</div>
                </div>
                <div class="previewBlock">
                    <div class="previewTitle">
                        缩略图（长边 256px）
                        <span v-if="thumbProcessing" class="processing">处理中…</span>
                    </div>
                    <img
                        v-if="thumbUrl"
                        :src="thumbUrl"
                        alt="缩略图预览"
                    />
                    <div class="processedSize">大小：{{ thumbSizeStr }}</div>
                </div>
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
.fileUpload {
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

.controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    .dimensionRow {
        display: flex;
        gap: 8px;
        .controlRow {
            flex: 1;
            min-width: 0;
            label {
                width: 24px;
            }
            input[type='number'] {
                flex: 1;
                min-width: 0;
                width: auto;
            }
        }
    }
    .controlRow {
        display: flex;
        align-items: center;
        gap: 8px;
        label {
            width: 40px;
            font-size: 13px;
            color: #666;
            flex-shrink: 0;
        }
        input[type='number'] {
            width: 80px;
            margin: 0;
        }
    }
    .qualityRow {
        input[type='range'] {
            flex: 1;
            margin: 0;
        }
        .qualityValue {
            width: 40px;
            text-align: right;
            font-size: 13px;
        }
    }
    .ratioHint {
        font-size: 12px;
        color: #999;
    }
}

.error {
    color: #c00;
    font-size: 13px;
}

.previews {
    display: flex;
    flex-direction: column;
    gap: 12px;
    .previewBlock {
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 8px;
        background-color: #fafafa;
        .previewTitle {
            font-size: 13px;
            color: #666;
            margin-bottom: 6px;
            .processing {
                color: cornflowerblue;
                margin-left: 6px;
            }
        }
        img {
            max-width: 100%;
            max-height: 200px;
            display: block;
            margin: 0 auto;
            border-radius: 4px;
        }
        .processedSize {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 6px;
        }
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
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    border-bottom: none;
}
</style>
