<script setup lang="ts">
import { ref } from 'vue';
import { UserFileType } from '@/app/com/apiGenerated';
import ImageUpload from './ImageUpload.vue';
import GenericFileUpload from './GenericFileUpload.vue';

const props = defineProps<{
    type: UserFileType;
    onSuccess?: () => void;
}>();

const imageUploadRef = ref<InstanceType<typeof ImageUpload>>();
const genericFileUploadRef = ref<InstanceType<typeof GenericFileUpload>>();

function open() {
    if (props.type === UserFileType.Icon) {
        imageUploadRef.value?.open();
    } else {
        genericFileUploadRef.value?.open();
    }
}

function close() {
    if (props.type === UserFileType.Icon) {
        imageUploadRef.value?.close();
    } else {
        genericFileUploadRef.value?.close();
    }
}

defineExpose({ open, close });
</script>

<template>
    <ImageUpload ref="imageUploadRef" :on-success="onSuccess" />
    <GenericFileUpload ref="genericFileUploadRef" :type="type" :on-success="onSuccess" />
</template>
