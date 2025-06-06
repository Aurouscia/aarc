<script lang="ts" setup>
import { ref } from 'vue';

const show = ref(false);
defineProps<{
    title: string,
    special?: boolean
}>()
</script>

<template>
<h2 :class="{sectorShown:show}" @click="show = !show">
    <div class="shownStatusIcon">{{ show ? '×':'+' }}</div>
    <div :class="{special}">{{ title }}</div>
</h2>
<slot v-if="show"></slot>
</template>

<style lang="scss" scoped>
@use './configSection.scss';
</style>