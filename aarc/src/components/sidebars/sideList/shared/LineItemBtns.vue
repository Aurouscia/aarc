<script lang="ts" setup>
import { Line } from '@/models/save';
import { useEnvStore } from '@/models/stores/envStore';
import { useCvsFrameStore } from '@/models/stores/cvsFrameStore';
import { useSaveStore } from '@/models/stores/saveStore';
import { computed } from 'vue';
import settingsIcon from '@/assets/ui/settings.svg';
import branchIcon from '@/assets/ui/editor/branch.svg';
import branchSeperateIcon from '@/assets/ui/editor/branchSeperate.svg';
import calendarIcon from '@/assets/ui/calendar.svg';
import searchIcon from '@/assets/ui/search.svg';

const envStore = useEnvStore()
const cvs = useCvsFrameStore()
const saveStore = useSaveStore()

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

const emit = defineEmits<{
    (e:'closeSidebar'):void
}>()

function centerOnLine(){
    const firstPtId = props.l.pts.at(0)
    if(!firstPtId) return
    const pt = saveStore.getPtById(firstPtId)
    if(!pt) return
    cvs.focusViewToPos(pt.pos)
    envStore.activeLine = props.l
    envStore.activePt = pt;
    envStore.cursorPos = [...pt.pos]
    emit('closeSidebar')
}

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
        <img class="btn-icon" :src="calendarIcon"/>
    </div>
    <div v-if="mode==='B'" class="sqrBtn moveBtn" :class="{ sqrActive: arrangingId === l.id }" @mousedown="e => mouseDownLineArrange(e, l.id)"
        @touchstart="e => mouseDownLineArrange(e, l.id)">
        ⇅
    </div>
    <div v-if="mode==='B'" class="sqrBtn" @click="delLineStart(l)">
        ×
    </div>
    <img :src="searchIcon" class="search-icon" @click="centerOnLine" title="点击寻找该线路的位置"/>
</template>

<style scoped lang="scss">
.btn-icon{
    width: 20px;
    height: 20px;
    margin: 5px;
    filter: brightness(0) contrast(1000%); // 变纯黑
    &.btn-icon-bigger{
        width: 22px;
        height: 22px;
        margin: 4px;
    }
}

.search-icon{
    // 位于右下角的搜索按钮，需要外层线路卡片是 position 非 static 才能正确定位
    position: absolute;
    right: 2px;
    bottom: -1px;
    width: 11px;
    height: 11px;
    padding: 0px 4px 4px 0px;
    cursor: pointer;
    &:hover{
        filter: brightness(0.6);
    }
}
</style>