<script lang="ts" setup>
import { Line } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { computed } from 'vue';
import branchIcon from '@/assets/ui/editor/branch.svg';
import branchSeperateIcon from '@/assets/ui/editor/branchSeperate.svg';
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents';

const envStore = useEnvStore()
const { pop } = useUniqueComponentsStore()

const props = defineProps<{
    mouseDownLineArrange: (e: MouseEvent | TouchEvent, id: number) => void,
    delLineStart: (l: Line) => void,
    editInfoOfLine: (l: Line) => void,
    showChildrenOf: (l: Line) => void,
    leaveParent: (l: Line) => void,
    arrangingId: number,
    l: Line,
    lineTypeCalled: string,
    showingBtns?:'children'|'arrange'
    isInChildrenList?:boolean
}>()
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
    <div class="infoEdit">
        <div class="sqrBtn" @click="editInfoOfLine(l)">...</div>
    </div>
    <div v-if="mode==='A' && !isInChildrenList" class="sqrBtn" @click="showChildrenOf(l)">
        <img class="btnIcon" :src="branchIcon"/>
    </div>
    <div v-if="mode==='A' && isInChildrenList" class="sqrBtn" @click="leaveParent(l)">
        <img class="btnIcon" :src="branchSeperateIcon"/>
    </div>
    <div v-if="mode==='A'" class="sqrBtn" @click="pop?.show('时间轴（敬请期待）', 'info')"></div>
    <div v-if="mode==='B'" class="sqrBtn moveBtn" :class="{ sqrActive: arrangingId === l.id }" @mousedown="e => mouseDownLineArrange(e, l.id)"
        @touchstart="e => mouseDownLineArrange(e, l.id)">
        ⇅
    </div>
    <div v-if="mode==='B'" class="sqrBtn" @click="delLineStart(l)">
        ×
    </div>
</template>

<style scoped lang="scss">
@use './arrangableList.scss';

.btnIcon{
    margin: 5px;
    border-radius: 5px;
}
</style>