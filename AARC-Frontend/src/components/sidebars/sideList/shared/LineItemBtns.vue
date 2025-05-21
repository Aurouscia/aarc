<script lang="ts" setup>
import { Line } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';

const envStore = useEnvStore()
defineProps<{
    mouseDownLineArrange: (e: MouseEvent | TouchEvent, id: number) => void,
    delLineStart: (l: Line) => void,
    editInfoOfLine: (l: Line) => void,
    showChildrenOf: (l: Line) => void,
    arrangingId: number,
    l: Line,
    lineTypeCalled: string,
    showingBtns?:'children'|'arrange'
}>()
</script>

<template>
    <div class="names">
        <input v-model="l.name" :placeholder="`输入${lineTypeCalled}名`" @blur="envStore.lineInfoChanged(l)" />
        <input v-model="l.nameSub" :placeholder="`输入${lineTypeCalled}副名`" @blur="envStore.lineInfoChanged(l)" />
    </div>
    <div class="infoEdit">
        <div class="sqrBtn" @click="editInfoOfLine(l)">...</div>
    </div>
    <div v-if="showingBtns=='children'" class="sqrBtn" @click="showChildrenOf(l)">
        支
    </div>
    <div v-else class="sqrBtn moveBtn" :class="{ sqrActive: arrangingId === l.id }" @mousedown="e => mouseDownLineArrange(e, l.id)"
        @touchstart="e => mouseDownLineArrange(e, l.id)">
        ⇅
    </div>
    <div v-if="showingBtns=='children'" class="sqrBtn">    
    </div>
    <div v-else class="sqrBtn" @click="delLineStart(l)">
        ×
    </div>
</template>

<style scoped lang="scss">
@use './arrangableList.scss';
</style>