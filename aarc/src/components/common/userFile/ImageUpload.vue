<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue';
import { resizeImage } from '@aurouscia/image-compress';
import { dataSizeStr } from '@/utils/fileUtils/dataSizeStr';
import { isSvg } from '@/utils/fileUtils/ext';
import { debounce } from '@/utils/lang/debounce';
import { useApiStore } from '@/app/com/apiStore';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';
import { UserFileType } from '@/app/com/apiGenerated';
import SideBar from '../SideBar.vue';
import Notice from '../Notice.vue';

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
const convertSvgToBitmap = ref(false);
const processing = ref(false);
const thumbProcessing = ref(false);
const uploading = ref(false);
const processError = ref<string>();

const originalSizeStr = computed(() =>
    file.value ? dataSizeStr(file.value.size) : '-'
);
const fileIsSvg = computed(() =>
    file.value ? isSvg(file.value.name) : false
);
const showNameHint = computed(() => {
    const name = displayName.value.trim();
    if (!name) return false;
    const hyphenCount = (name.match(/-/g) || []).length;
    return hyphenCount !== 1;
});

async function processImage() {
    if (!file.value) return;
    if (fileIsSvg.value && !convertSvgToBitmap.value) return;
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

const debouncedProcessImage = debounce(processImage, 500);

watch(width, debouncedProcessImage);
watch(height, debouncedProcessImage);
watch(quality, debouncedProcessImage);

watch(convertSvgToBitmap, (newVal) => {
    if (newVal) {
        processImage();
    } else {
        if (processedUrl.value) URL.revokeObjectURL(processedUrl.value);
        processedUrl.value = undefined;
        processedBlob.value = undefined;
        processedSizeStr.value = '-';
        processError.value = undefined;
    }
});

function initDimensions(imgWidth: number, imgHeight: number) {
    originalWidth.value = imgWidth;
    originalHeight.value = imgHeight;
    const ow = imgWidth;
    const oh = imgHeight;
    const max = Math.max(ow, oh);
    let w: number;
    let h: number;
    if (max <= 1024) {
        w = ow;
        h = oh;
    } else {
        const ratio = 1024 / max;
        w = Math.round(ow * ratio);
        h = Math.round(oh * ratio);
    }
    // 保证较小的一边至少为 8，并按原比例缩放另一边
    if (w < 8) {
        w = 8;
        h = Math.round((w * oh) / ow);
    }
    if (h < 8) {
        h = 8;
        w = Math.round((h * ow) / oh);
    }
    // 不超过原图尺寸
    if (w > ow) {
        w = ow;
        h = oh;
    }
    if (h > oh) {
        h = oh;
        w = ow;
    }
    width.value = w;
    height.value = h;
}

function applyDimension(dimension: 'width' | 'height', raw: number) {
    const ow = originalWidth.value;
    const oh = originalHeight.value;
    let target = Math.max(8, raw);
    if (dimension === 'width' && ow > 0) target = Math.min(target, ow);
    if (dimension === 'height' && oh > 0) target = Math.min(target, oh);

    if (!ow || !oh) {
        if (dimension === 'width') width.value = target;
        else height.value = target;
        return;
    }

    let w =
        dimension === 'width'
            ? target
            : Math.round((target * ow) / oh);
    let h =
        dimension === 'height'
            ? target
            : Math.round((target * oh) / ow);

    // 保证较小的一边至少为 8，并按原比例缩放另一边
    if (w < 8) {
        w = 8;
        h = Math.round((w * oh) / ow);
    }
    if (h < 8) {
        h = 8;
        w = Math.round((h * ow) / oh);
    }

    // 不超过原图尺寸
    if (w > ow) {
        w = ow;
        h = oh;
    }
    if (h > oh) {
        h = oh;
        w = ow;
    }

    width.value = w;
    height.value = h;
}

function parseDimensionInput(value: string): number {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : 0;
}

function onWidthChange(e: Event) {
    applyDimension(
        'width',
        parseDimensionInput((e.target as HTMLInputElement).value)
    );
}

function onHeightChange(e: Event) {
    applyDimension(
        'height',
        parseDimensionInput((e.target as HTMLInputElement).value)
    );
}

function openProcessedInNewTab() {
    if (processedUrl.value) {
        window.open(processedUrl.value, '_blank');
    }
}

function onFileSelected(selected: File) {
    if (originalUrl.value) URL.revokeObjectURL(originalUrl.value);
    if (processedUrl.value) URL.revokeObjectURL(processedUrl.value);
    if (thumbUrl.value) URL.revokeObjectURL(thumbUrl.value);
    file.value = selected;
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
        if (!fileIsSvg.value || convertSvgToBitmap.value) {
            processImage();
        }
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
    convertSvgToBitmap.value = false;
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
    const trimmedName = displayName.value.trim();
    if (!trimmedName) {
        showPop('名称不能为空', 'failed');
        return;
    }
    displayName.value = trimmedName;
    const keepSvgOriginal = fileIsSvg.value && !convertSvgToBitmap.value;
    if (keepSvgOriginal) {
        if (!thumbBlob.value) {
            showPop('您的设备过旧\n请更换设备重试', 'failed');
            return;
        }
    } else {
        if (!processedBlob.value || !thumbBlob.value) {
            showPop('您的设备过旧\n请更换设备重试', 'failed');
            return;
        }
    }
    uploading.value = true;
    try {
        const mainFile = keepSvgOriginal ? file.value : processedBlob.value!;
        const mainFileName = keepSvgOriginal
            ? file.value.name
            : 'processed.webp';
        const thumb = thumbBlob.value!;
        const res = await api.userFile.upload(
            { data: mainFile, fileName: mainFileName },
            { data: thumb, fileName: 'thumb.webp' },
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

defineExpose({ open, close });
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
                    <span class="value">
                        {{ originalSizeStr }}
                        <template v-if="originalWidth && originalHeight">
                            （{{ originalWidth }}×{{ originalHeight }}）
                        </template>
                    </span>
                </div>
            </div>

            <div class="inputRow">
                <label>显示名称</label>
                <input v-model="displayName" placeholder="分类名-图片名" />
            </div>
            <Notice
                v-if="showNameHint"
                :type="'warn'"
            >
                建议使用“A-B”格式的名称，中间用连字符（减号）隔开，A表示分类名，这样可以让资源更便于筛选和使用
            </Notice>

            <div v-if="file" class="controls">
                <div v-if="fileIsSvg" class="controlRow svgConvertRow">
                    <label>转换为位图</label>
                    <input v-model="convertSvgToBitmap" type="checkbox" />
                </div>
                <template v-if="!fileIsSvg || convertSvgToBitmap">
                    <div class="dimensionRow">
                        <div class="controlRow">
                            <label>宽</label>
                            <input
                                :value="width"
                                type="number"
                                :min="8"
                                :max="originalWidth || undefined"
                                @change="onWidthChange"
                            />
                        </div>
                        <div class="controlRow">
                            <label>高</label>
                            <input
                                :value="height"
                                type="number"
                                :min="8"
                                :max="originalHeight || undefined"
                                @change="onHeightChange"
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
                </template>
            </div>

            <div v-if="processError" class="error">{{ processError }}</div>

            <div v-if="file" class="previews">
                <div class="previewBlock">
                    <div v-if="!fileIsSvg || convertSvgToBitmap" class="previewTitle">
                        处理后（点击预览）
                        <span v-if="processing" class="processing">处理中…</span>
                    </div>
                    <template v-if="fileIsSvg && !convertSvgToBitmap">
                        <div class="svgKeepHint">svg将保持原样上传 ({{ originalSizeStr }})</div>
                    </template>
                    <template v-else>
                        <img
                            v-if="processedUrl"
                            class="processed-preview"
                            :src="processedUrl"
                            alt="处理后预览"
                            title="点击在新标签页打开"
                            @click="openProcessedInNewTab"
                        />
                        <div class="processedSize">大小：{{ processedSizeStr }}</div>
                    </template>
                </div>
                <div class="previewBlock">
                    <div class="previewTitle">
                        缩略图
                        <span v-if="thumbProcessing" class="processing">处理中…</span>
                    </div>
                    <img
                        v-if="thumbUrl"
                        class="thumb-preview"
                        :src="thumbUrl"
                        alt="缩略图预览"
                    />
                    <div class="processedSize">大小：{{ thumbSizeStr }}</div>
                </div>
            </div>

            <Notice
                v-if="fileIsSvg && file && file.size > 30 * 1024 && !convertSvgToBitmap"
                :type="'warn'"
            >
                过大的SVG图片可能在使用中造成卡顿，建议勾选“转换为位图”以获得更佳体验
            </Notice>

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
    .svgConvertRow {
        label {
            width: 80px;
        }
        input[type='checkbox'] {
            width: 20px;
            height: 20px;
            margin: 0;
        }
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
        img.thumb-preview {
            width: 64px;
            height: 64px;
            max-width: 64px;
            max-height: 64px;
            object-fit: contain;
            background-color: #eee;
        }
        img.processed-preview {
            cursor: pointer;
        }
        .processedSize {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 6px;
        }
        .svgKeepHint {
            text-align: center;
            font-size: 13px;
            color: #666;
            padding: 20px 0;
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
