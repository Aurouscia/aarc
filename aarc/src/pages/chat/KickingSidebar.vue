<script setup lang="ts">
import { useApiStore } from '@/app/com/apiStore'
import { useSignalrStore } from '@/app/com/signalrStore'
import { useUniqueComponentsStore } from '@/app/globalStores/uniqueComponents'
import { msToMinSec } from '@/utils/timeUtils/timeStr'
import { computed, onUnmounted, ref, useTemplateRef } from 'vue'
import SideBar from '@/components/common/SideBar.vue'
import {
    KICK_IDLE_THRESHOLD_MS,
    KICK_INFO_REFRESH_MS,
    KICK_TAKEOVER_WAIT_MS,
    SECOND_MS,
    minText
} from './consts'

const props = defineProps<{
    saveId: number
    isOwner: boolean
}>()

const api = useApiStore()
const signalrStore = useSignalrStore()
const { showPop } = useUniqueComponentsStore()
const kickingSidebar = useTemplateRef('kickingSidebar')

const lastActive = ref<string | null>(null)
const lastActiveUnix = ref<number | null>(null)
const now = ref(Date.now())
let nowTimer: number | null = null
const takeoverWaiting = ref(false)
const takeoverReady = ref(false)
const takeoverRemainingMs = ref(0)
let takeoverTimer: number | null = null
let infoRefreshTimer: number | null = null

const lastActiveAgo = computed(() => {
    const ts = lastActiveUnix.value
    if (!ts) return null
    const diff = now.value - ts
    if (diff < 0) return null
    return `${msToMinSec(diff)}前`
})
const lastActiveTimeText = computed(() => {
    const ts = lastActiveUnix.value
    if (!ts) return ''
    const d = new Date(ts)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})
const idleThresholdText = computed(() => minText(KICK_IDLE_THRESHOLD_MS))
const takeoverWaitSeconds = computed(() => Math.ceil(takeoverRemainingMs.value / SECOND_MS))

function startNowTimer() {
    if (nowTimer === null) {
        nowTimer = window.setInterval(() => {
            now.value = Date.now()
        }, SECOND_MS)
    }
}

function stopNowTimer() {
    if (nowTimer !== null) {
        window.clearInterval(nowTimer)
        nowTimer = null
    }
}

async function loadLastActive() {
    try {
        const info = await api.save.loadInfo(props.saveId)
        lastActive.value = info?.lastActive ?? null
        lastActiveUnix.value = info?.lastActiveUnix ?? null
    } catch (e: any) {
        console.error('[KickingSidebar] 加载 LastActive 失败', e)
        lastActive.value = null
        lastActiveUnix.value = null
    }
}

function onKickingSidebarExtend() {
    startNowTimer()
    if (props.isOwner) {
        loadLastActive()
        if (infoRefreshTimer === null) {
            infoRefreshTimer = window.setInterval(() => {
                loadLastActive()
            }, KICK_INFO_REFRESH_MS)
        }
    }
}

function onKickingSidebarFold() {
    if (infoRefreshTimer !== null) {
        window.clearInterval(infoRefreshTimer)
        infoRefreshTimer = null
    }
}

async function startTakeover() {
    await loadLastActive()
    const ts = lastActiveUnix.value
    if (!ts || now.value - ts < KICK_IDLE_THRESHOLD_MS) {
        showPop('时间未到', 'failed')
        return
    }
    const roomName = props.saveId.toString()
    await signalrStore.notifyKickEditingUser(roomName)
    if (takeoverTimer !== null) {
        window.clearInterval(takeoverTimer)
        takeoverTimer = null
    }
    takeoverWaiting.value = true
    takeoverReady.value = false
    takeoverRemainingMs.value = KICK_TAKEOVER_WAIT_MS
    takeoverTimer = window.setInterval(() => {
        takeoverRemainingMs.value -= SECOND_MS
        if (takeoverRemainingMs.value <= 0) {
            if (takeoverTimer !== null) {
                window.clearInterval(takeoverTimer)
                takeoverTimer = null
            }
            takeoverWaiting.value = false
            takeoverReady.value = true
        }
    }, SECOND_MS)
}

async function takeoverSave() {
    try {
        const ok = await api.save.kick(props.saveId)
        if (ok) {
            showPop('已接管存档', 'success')
            window.setTimeout(() => {
                window.location.reload()
            }, SECOND_MS)
        }
    } catch (e: any) {
        console.error('[KickingSidebar] 接管存档失败', e)
    }
}

function extend() {
    kickingSidebar.value?.extend()
}

onUnmounted(() => {
    if (takeoverTimer !== null) {
        window.clearInterval(takeoverTimer)
        takeoverTimer = null
    }
    if (infoRefreshTimer !== null) {
        window.clearInterval(infoRefreshTimer)
        infoRefreshTimer = null
    }
    stopNowTimer()
})

defineExpose({ extend })
</script>

<template>
<SideBar ref="kickingSidebar" :shrink-way="'v-show'" @extend="onKickingSidebarExtend" @fold="onKickingSidebarFold">
    <div class="kickingSidebarContent">
        <div v-if="isOwner" class="ownerSection">
            <button v-if="!takeoverWaiting && !takeoverReady" class="danger" @click="startTakeover">请出</button>
            <div v-else-if="takeoverWaiting" class="takeoverWaiting">已通知编辑者离开，{{ takeoverWaitSeconds }} 秒后可强制接管</div>
            <button v-else-if="takeoverReady" class="danger" @click="takeoverSave">接管存档</button>
            <p class="occupancyText">如果用户无保存操作占用存档{{ idleThresholdText }}以上，你可以将其请出去</p>
            <p class="lastActiveText">上次保存时间：</p>
            <div class="lastActiveDetail">
                <span>{{ lastActiveTimeText || '加载中...' }}</span>
                <span v-if="lastActiveAgo">（{{ lastActiveAgo }}）</span>
            </div>
        </div>
        <div v-else class="guestSection">
            <p class="occupancyText">如果你无保存操作占用存档{{ idleThresholdText }}以上，所有者可以将你请出去</p>
        </div>
    </div>
</SideBar>
</template>

<style lang="scss" scoped>
.kickingSidebarContent {
    padding: 20px 10px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    .ownerSection, .guestSection {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
        background-color: #fffbe6;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .danger {
        background-color: #dc3545;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 6px 12px;
        cursor: pointer;
        &:hover {
            background-color: #c82333;
        }
    }
    .occupancyText {
        margin: 0;
        font-size: 13px;
        color: #856404;
    }
    .lastActiveText {
        margin: 0;
        font-size: 13px;
        color: #333;
    }
    .lastActiveDetail {
        font-size: 19px;
        font-weight: bold;
        color: #333;
        span {
            margin-right: 4px;
        }
    }
    .takeoverWaiting {
        font-size: 14px;
        color: #856404;
        text-align: center;
        padding: 6px 0;
    }
}
</style>
