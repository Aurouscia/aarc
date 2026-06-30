<script setup lang="ts">
import { useSignalrStore, ChatMessage } from '@/app/com/signalrStore'
import { useUserInfoStore } from '@/app/globalStores/userInfo'
import { useChatMsgsReadStore } from '@/app/globalStores/chatMsgsReadStore'
import SideBar from '@/components/common/SideBar.vue'
import messageIcon from '@/assets/ui/message.svg'
import { disableContextMenu, enableContextMenu } from '@/utils/eventUtils/contextMenu'
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import Notice from '@/components/common/Notice.vue'
import { guideInfo } from '@/app/guideInfo'

const props = defineProps<{
    saveId: number
    enabled: boolean
    canEnable: boolean
}>()
const emit = defineEmits<{
    enable: []
    disable: []
}>()

const signalrStore = useSignalrStore()
const userInfoStore = useUserInfoStore()
const chatMsgsReadStore = useChatMsgsReadStore()
const sidebar = useTemplateRef('sidebar')

const messageInput = ref('')
const localError = ref<string | null>(null)
const isSidebarOpen = ref(false)

const roomName = computed(() => props.saveId.toString())
const messages = computed(() => signalrStore.getRoomMessages(roomName.value))
const isInRoom = computed(() => signalrStore.joinedRooms.has(roomName.value))
const effectiveEnabled = computed(() => props.enabled && !signalrStore.disabledRooms.has(roomName.value))
const unreadCount = computed(() => messages.value.filter(
    msg => !msg.isSystem && !chatMsgsReadStore.isRead(props.saveId, msg.sentAt)
).length)

watch(messages, (newVal) => {
    if (isSidebarOpen.value && newVal.length > 0) {
        const latest = newVal[newVal.length - 1]
        chatMsgsReadStore.markRead(props.saveId, latest.sentAt)
    }
}, { deep: true })

watch(effectiveEnabled, async (enabled) => {
    if (enabled && isSidebarOpen.value) {
        await onSidebarExtend()
    }
})

async function joinRoom() {
    localError.value = null
    const ok = await signalrStore.joinRoom(roomName.value)
    if (!ok) {
        localError.value = signalrStore.error
    }
}

async function leaveRoom() {
    localError.value = null
    await signalrStore.leaveRoom(roomName.value)
}

async function sendMessage() {
    localError.value = null
    if (!messageInput.value.trim()) return
    const ok = await signalrStore.sendMessage(roomName.value, messageInput.value)
    if (ok) {
        messageInput.value = ''
    }
}

function formatTime(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleTimeString()
}

function messageClass(msg: ChatMessage): string {
    if (msg.isSystem) return 'system'
    if (msg.userId === userInfoStore.userInfo.id) return 'self'
    return 'other'
}

async function onSidebarExtend() {
    isSidebarOpen.value = true
    enableContextMenu()
    if (!effectiveEnabled.value) return
    if (!isInRoom.value) {
        await joinRoom()
    }
    await signalrStore.syncHistory(roomName.value)
    if (messages.value.length > 0) {
        const latest = messages.value[messages.value.length - 1]
        chatMsgsReadStore.markRead(props.saveId, latest.sentAt)
    }
}

function onSidebarFold() {
    isSidebarOpen.value = false
    disableContextMenu()
}

function open() {
    sidebar.value?.extend()
}

function fold() {
    sidebar.value?.fold()
}

defineExpose({ open, fold })

onMounted(async () => {
    console.log(`[ChatRoom] 组件挂载 saveId=${props.saveId} effectiveEnabled=${effectiveEnabled.value}`)
    if (!effectiveEnabled.value) return
    await joinRoom()
    await signalrStore.syncHistory(roomName.value)
})

onUnmounted(async () => {
    await leaveRoom()
    await signalrStore.stopConnection()
    signalrStore.clearMessages()
})
</script>

<template>
<div class="chatRoomOuter">
    <div class="chatBtn" @click="open" title="打开聊天">
        <img :src="messageIcon" alt="消息"/>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
    </div>
    <SideBar ref="sidebar" @extend="onSidebarExtend" @fold="onSidebarFold" :shrink-way="'v-show'">
        <div v-if="effectiveEnabled" class="chatRoom">
            <div class="header">房间：{{ roomName }}</div>
            <div class="status">
                <span v-if="signalrStore.isConnected" class="connected">已连接</span>
                <span v-else class="disconnected">未连接</span>
                <span v-if="isInRoom" class="joined">已加入</span>
            </div>
            <div v-if="localError || signalrStore.error" class="error">
                {{ localError || signalrStore.error }}
            </div>
            <div v-else-if="canEnable" class="disableChatWrap">
                <button class="lite" @click="emit('disable')">关闭聊天功能</button>
            </div>
            <div class="messages">
                <div
                    v-for="(msg, idx) in messages"
                    :key="idx"
                    class="message"
                    :class="messageClass(msg)"
                >
                    <div class="meta">
                        <span class="userName">{{ msg.userName }}</span>
                        <span class="time">{{ formatTime(msg.sentAt) }}</span>
                    </div>
                    <div class="content">{{ msg.content }}</div>
                </div>
                <div v-if="messages.length === 0" class="emptyTip">暂无消息</div>
            </div>
            <div class="inputArea">
                <input
                    v-model="messageInput"
                    type="text"
                    placeholder="输入消息..."
                    :disabled="!isInRoom"
                    @keyup.enter="sendMessage"
                />
                <button @click="sendMessage" :disabled="!isInRoom || !messageInput.trim()">发送</button>
            </div>
        </div>
        <div v-else class="chatDisabled">
            <div class="header">房间：{{ roomName }}</div>
            <div class="disabledTip">当前存档未启用聊天功能</div>
            <button v-if="canEnable" class="enableBtn" @click="emit('enable')">启用</button>
            <div v-else class="contactTip">请联系存档所有者启用</div>
            <Notice v-if="canEnable" :type="'info'">
                如果遇到类似“丢消息”的问题，请反馈：{{ guideInfo.findHelp }}
            </Notice>
        </div>
    </SideBar>
</div>
</template>

<style lang="scss" scoped>
.chatRoomOuter {
    display: inline-block;
}
.chatBtn {
    width: 30px;
    height: 30px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 6px;
    background-color: #f5f5f5;
    transition: background-color 0.2s;
    &:hover {
        background-color: #e0e0e0;
    }
    img {
        width: 22px;
        height: 22px;
    }
    .badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 14px;
        height: 14px;
        padding: 0 3px;
        border-radius: 7px;
        background-color: red;
        color: white;
        font-size: 10px;
        line-height: 14px;
        text-align: center;
        font-weight: bold;
        pointer-events: none;
    }
}
.chatRoom {
    padding: 20px 10px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: calc(100% - 40px);
    .header {
        font-size: 18px;
        font-weight: bold;
        text-align: center;
    }
    .status {
        font-size: 14px;
        color: #666;
        display: flex;
        gap: 12px;
        justify-content: center;
        .connected {
            color: green;
        }
        .disconnected {
            color: red;
        }
        .joined {
            color: #4a90e2;
        }
    }
    .error {
        color: red;
        font-size: 14px;
        text-align: center;
    }
    .disableChatWrap {
        text-align: center;
    }
    .messages {
        border: 1px solid #ddd;
        border-radius: 8px;
        height: calc(100vh - 240px);
        overflow-y: auto;
        padding: 12px;
        background-color: #f9f9f9;
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
        .message {
            max-width: 90%;
            padding: 8px 12px;
            border-radius: 8px;
            word-break: break-word;
            .meta {
                font-size: 12px;
                margin-bottom: 4px;
                display: flex;
                gap: 8px;
                .userName {
                    font-weight: bold;
                }
                .time {
                    color: #999;
                }
            }
            .content {
                font-size: 14px;
            }
            &.system {
                align-self: center;
                background-color: #fff3cd;
                color: #856404;
                font-style: italic;
                .meta {
                    display: none;
                }
            }
            &.self {
                align-self: flex-end;
                background-color: #d1e7ff;
            }
            &.other {
                align-self: flex-start;
                background-color: #e9e9e9;
            }
        }
        .emptyTip {
            align-self: center;
            color: #999;
            margin-top: auto;
            margin-bottom: auto;
        }
    }
    .inputArea {
        display: flex;
        gap: 8px;
        input {
            flex-grow: 1;
            flex-shrink: 1;
            border: 1px solid #ccc;
            border-radius: 6px;
            margin: 0px;
        }
        button {
            white-space: nowrap;
            margin: 0px;
            border: none;
            border-radius: 6px;
            background-color: #4a90e2;
            color: white;
            cursor: pointer;
            &:hover:not(:disabled) {
                background-color: #357abd;
            }
            &:disabled {
                background-color: #aaa;
                cursor: not-allowed;
            }
        }
    }
}
.chatDisabled {
    padding: 20px 10px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    .disabledTip {
        color: #999;
        font-size: 14px;
        text-align: center;
    }
    .enableBtn {
        padding-left: 24px;
        padding-right: 24px;
        border: none;
        border-radius: 6px;
        background-color: #4a90e2;
        color: white;
        cursor: pointer;
        &:hover {
            background-color: #357abd;
        }
    }
    .contactTip {
        color: #999;
        font-size: 14px;
    }
}
</style>
