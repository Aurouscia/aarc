<script setup lang="ts">
import { useApiStore } from '@/app/com/apiStore';
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { useSavesRoutesJump } from '../saves/routes/routesJump';
import { SaveDto } from '@/app/com/apiGenerated';
import SaveAvatar from './SaveAvatar.vue';
import Loading from '@/components/common/Loading.vue';
import { useSaveListLocalConfigStore } from '@/app/localConfig/saveListLocalConfig';

const props = defineProps<{
    forAuditor?: boolean
}>()
const api = useApiStore()
const { someonesSavesRoute } = useSavesRoutesJump()
const saveListLocalConfig = useSaveListLocalConfigStore()
const ITEM_WIDTH = 120
const ITEM_GAP = 15

const list = ref<SaveDto[]>([])
const firstItemMargin = ref(0)
const firstItemTransition = ref('none')
const newestSavesRef = useTemplateRef('newestSavesRef')
const isAutoRefreshingNow = ref(true)

function updateAutoRefreshStatus(){
    const mode = saveListLocalConfig.autoRefreshNewest
    if(mode === true)
        isAutoRefreshingNow.value = true
    else if(mode === false)
        isAutoRefreshingNow.value = false
    else
        isAutoRefreshingNow.value = newestSavesRef.value?.scrollLeft === 0
}

function shouldAutoRefresh(): boolean {
    updateAutoRefreshStatus()
    return isAutoRefreshingNow.value
}

async function load(){
    let resp:SaveDto[]|undefined
    if(props.forAuditor)
        resp = await api.save.getNewestSavesAudit()
    else
        resp = await api.save.getNewestSaves()
    if(!resp)
        return
    if(list.value.length === 0){
        list.value = resp
        loaded.value = true
        return
    }
    const firstOldId = list.value[0]?.id
    const newCount = firstOldId !== undefined
        ? resp.findIndex(s => s.id === firstOldId)
        : -1
    if(newCount > 0){
        const totalShift = newCount * (ITEM_WIDTH + ITEM_GAP)
        firstItemTransition.value = 'none'
        firstItemMargin.value = -totalShift
        list.value = resp
        await new Promise(r=>{setTimeout(r, 500)})
        firstItemTransition.value = 'margin-left 1s ease'
        firstItemMargin.value = 0
    }else{
        list.value = resp
    }
}

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
let loadTimer: ReturnType<typeof setInterval> | null = null

function lastActiveFromNow(unix?: number){
    if(!unix)
        return ''
    const diff = now.value - unix
    const oneDayMs = 24 * 60 * 60 * 1000
    const oneHourMs = 60 * 60 * 1000
    const oneMinMs = 60 * 1000
    const oneSec = 1000
    if(diff >= oneDayMs * 4)
        return ''
    if(diff > oneDayMs)
        return Math.floor(diff / oneDayMs) + '天前'
    if(diff > oneHourMs)
        return Math.floor(diff / oneHourMs) + '小时前'
    if(diff > oneMinMs)
        return Math.floor(diff / oneMinMs) + '分钟前'
    return Math.floor(diff / oneSec) + '秒前'
}

const listWithStyle = computed(() => {
    return list.value.map((s, i): { s: SaveDto, style: CSSProperties } => ({
        s,
        style: {
            width: ITEM_WIDTH + 'px',
            ...(i === 0 ? {
                marginLeft: firstItemMargin.value + 'px',
                transition: firstItemTransition.value
            } : {})
        }
    }))
})

const loaded = ref(false)

onMounted(async()=>{
    await load()
    timer = setInterval(() => {
        now.value = Date.now()
    }, 1000)
    loadTimer = setInterval(() => {
        if(shouldAutoRefresh()){
            load()
        }
    }, 10000)
})

watch(() => saveListLocalConfig.autoRefreshNewest, () => {
    updateAutoRefreshStatus()
})

onUnmounted(()=>{
    if(timer){
        clearInterval(timer)
        timer = null
    }
    if(loadTimer){
        clearInterval(loadTimer)
        loadTimer = null
    }

})
</script>

<template>
<div v-if="loaded">
    <div class="autoRefreshRow">
        <div class="statusDot" :class="{ active: isAutoRefreshingNow }"></div>
        <label>
            <select v-model="saveListLocalConfig.autoRefreshNewest">
                <option :value="true">更新常开</option>
                <option :value="false">更新常关</option>
                <option value="auto">自动更新</option>
            </select>
        </label>
    </div>
    <div ref="newestSavesRef" class="newestSaves" :style="{ gap: ITEM_GAP + 'px' }" @scroll="updateAutoRefreshStatus">
    <div v-for="item in listWithStyle" :key="item.s.id"
        :style="item.style">
        <SaveAvatar :s="item.s" :size="120"></SaveAvatar>
        <div class="cvsName">{{ item.s.name }}</div>
        <div class="cvsData">{{ item.s.lineCount }}线 {{ item.s.staCount }}站</div>
        <RouterLink :to="someonesSavesRoute(item.s.ownerUserId||0)" class="cvsOwner">
            {{ item.s.ownerName }}
        </RouterLink>
        <div class="cvsData">{{ lastActiveFromNow(item.s.lastActiveUnix) }}</div>
    </div>
    </div>
</div>
<Loading v-else></Loading>
</template>

<style scoped lang="scss">
.autoRefreshRow{
    display: flex;
    justify-content: flex-end;
    align-items: center;
    align-items: center;
    gap: 6px;
    .statusDot{
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #999;
        transition: background-color 0.3s ease;
        &.active{
            background-color: #4caf50;
        }
    }
    select{
        font-size: 14px;
        padding: 2px 4px;
        margin: 0px;
    }
}
.newestSaves{
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    max-width: 100%;
    overflow-x: auto;
    justify-content: flex-start;
    padding: 15px;
    &>div{
        flex-shrink: 0;
        flex-grow: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        .cvsName, .cvsOwner, .cvsData{
            max-width: 90%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            user-select: none;
        }
        .cvsOwner, .cvsData{
            font-size: 0.8em;
            color: #666;
        }
        .cvsOwner{
            padding: 3px;
            border-radius: 5px;
            background-color: #666;
            color: white;
            min-width: 80px;
            text-align: center;
            font-weight: bold;
        }
    }
}
</style>