<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{
    title: string,
    special?: boolean,
    defaultShow?: boolean,
    noTitle?: boolean
}>()
const show = ref(props.defaultShow??false);
</script>

<template>
<h2 v-if="!noTitle" :class="{sectorShown:show}" @click="show = !show">
    <div class="shownStatusIcon">{{ show ? '×':'+' }}</div>
    <div :class="{special}">{{ title }}</div>
</h2>
<slot v-if="show"></slot>
</template>

<style lang="scss" scoped>
@use './configSection.scss';
</style>