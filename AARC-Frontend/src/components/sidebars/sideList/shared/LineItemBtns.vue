<script lang="ts" setup>
import { Line } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { computed } from 'vue';
import settingsIcon from '@/assets/ui/settings.svg';
import branchIcon from '@/assets/ui/editor/branch.svg';
import branchSeperateIcon from '@/assets/ui/editor/branchSeperate.svg';

const envStore = useEnvStore()

const props = withDefaults(defineProps<{
    mouseDownLineArrange: (e: MouseEvent | TouchEvent, id: number) => void,
    delLineStart: (l: Line) => void,
    editInfoOfLine: (l: Line) => void,
    editTimeOfLine?: (l: Line) => void,
    showChildrenOf: (l: Line) => void,
    leaveParent: (l: Line) => void,
    arrangingId: number,
    l: Line,
    lineTypeCalled: string,
    showingBtns?:'children'|'arrange'
    isInChildrenList?:boolean
}>(), {
    editTimeOfLine: ()=>{}
})
const mode = computed<'A'|'B'>(()=>{
    if(props.showingBtns=='arrange')
        return 'B'
    return 'A'
})
</script>

<template>
    <div class="names">
        <input v-model="l.name" :placeholder="`输入${lineTypeCalled}名`" @blur="envStore.lineInfoChanged(l)" />
        <input v-model="l.nameSub" :placeholder="`输入${lineTypeCalled}副名`" @blur="envStore.lineInfoChanged(l)" />
    </div>
    <div class="sqrBtn" @click="editInfoOfLine(l)">
        <img class="btn-icon btn-icon-bigger" :src="settingsIcon"/>
    </div>
    <div v-if="mode==='A' && !isInChildrenList" class="sqrBtn" @click="showChildrenOf(l)">
        <img class="btn-icon" :src="branchIcon"/>
    </div>
    <div v-if="mode==='A' && isInChildrenList" class="sqrBtn" @click="leaveParent(l)">
        <img class="btn-icon" :src="branchSeperateIcon"/>
    </div>
    <div v-if="mode==='A'" class="sqrBtn" @click="editTimeOfLine(l)">
        ||||
    </div>
    <div v-if="mode==='B'" class="sqrBtn moveBtn" :class="{ sqrActive: arrangingId === l.id }" @mousedown="e => mouseDownLineArrange(e, l.id)"
        @touchstart="e => mouseDownLineArrange(e, l.id)">
        ⇅
    </div>
    <div v-if="mode==='B'" class="sqrBtn" @click="delLineStart(l)">
        ×
    </div>
</template>

<style scoped lang="scss">
.btn-icon{
    width: 20px;
    height: 20px;
    margin: 5px;
    border-radius: 5px;
    filter: brightness(0) contrast(1000%); // 变纯黑
    &.btn-icon-bigger{
        width: 22px;
        height: 22px;
        margin: 4px;
    }
}
</style>