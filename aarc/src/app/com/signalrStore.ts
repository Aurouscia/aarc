import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { HubConnectionBuilder, HubConnection, HubConnectionState, LogLevel } from "@microsoft/signalr"
import { useApiStore } from "./apiStore"

export interface ChatMessage {
    messageId: string
    roomName: string
    userId: number
    userName: string
    content: string
    sentAt: string
    isSystem: boolean
}

export const useSignalrStore = defineStore('signalr', () => {
    const apiStore = useApiStore()

    const connection = ref<HubConnection | null>(null)
    const connectionState = ref<HubConnectionState>(HubConnectionState.Disconnected)
    const messages = ref<ChatMessage[]>([])
    const joinedRooms = ref<Set<string>>(new Set())
    const disabledRooms = ref<Set<string>>(new Set())
    // 每个房间最后收到消息的时间戳（毫秒），用于重连后同步
    const lastReceivedTimes = ref<Record<string, number | undefined>>({})
    const seenMessageIds = ref<Set<string>>(new Set())
    const error = ref<string | null>(null)

    const isConnected = computed(() => connection.value?.state === HubConnectionState.Connected)

    function getHubUrl(): string {
        const baseUrl = import.meta.env.VITE_ApiUrlBase as string | undefined
        if (!baseUrl) {
            return '/chat'
        }
        return `${baseUrl.replace(/\/$/, '')}/chat`
    }

    async function ensureConnected(): Promise<HubConnection> {
        if (connection.value?.state === HubConnectionState.Connected) {
            return connection.value as HubConnection
        }
        if (!apiStore.jwtToken) {
            throw new Error('未登录，无法连接聊天服务器')
        }
        return await startConnection()
    }

    async function startConnection() {
        if (connection.value) {
            await stopConnection()
        }
        error.value = null
        const conn = new HubConnectionBuilder()
            .withUrl(getHubUrl(), {
                accessTokenFactory: () => apiStore.jwtToken ?? ''
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build()

        conn.onclose((err) => {
            connectionState.value = HubConnectionState.Disconnected
            console.log('[signalr]连接已关闭', err?.message ?? '')
            if (err) {
                error.value = `连接已关闭: ${err.message}`
            }
        })

        conn.onreconnecting((err) => {
            connectionState.value = HubConnectionState.Reconnecting
            console.log('[signalr]正在重新连接', err?.message ?? '')
            error.value = err ? `正在重新连接: ${err.message}` : '正在重新连接'
        })

        conn.onreconnected(() => {
            connectionState.value = HubConnectionState.Connected
            console.log('[signalr]重新连接成功')
            error.value = null
            rejoinRooms()
        })

        function toTimestamp(value: string): number {
            return new Date(value).getTime()
        }

        function handleIncomingMessage(msg: ChatMessage) {
            if (!msg?.messageId || seenMessageIds.value.has(msg.messageId)) return
            seenMessageIds.value.add(msg.messageId)
            messages.value.push(msg)
            const ts = toTimestamp(msg.sentAt)
            const existing = lastReceivedTimes.value[msg.roomName]
            if (existing === undefined || ts > existing) {
                lastReceivedTimes.value[msg.roomName] = ts
            }
            console.log(`[signalr]收到消息 [${msg.roomName}] ${msg.userName}: ${msg.content}`)
        }

        conn.on("ReceiveMessage", handleIncomingMessage)
        conn.on("UserJoined", handleIncomingMessage)
        conn.on("UserLeft", handleIncomingMessage)

        conn.on("ChatDisabled", (roomName: string) => {
            disabledRooms.value.add(roomName)
            console.log(`[signalr]房间 ${roomName} 的聊天功能已被禁用`)
        })

        conn.on("LoadHistory", (history: ChatMessage[]) => {
            if (!history || history.length === 0) return
            console.log(`[signalr]加载历史消息 ${history.length} 条`, history)
            const roomName = history[0].roomName
            const existingForRoom = messages.value.filter(x => x.roomName === roomName)
            const existingForOtherRooms = messages.value.filter(x => x.roomName !== roomName)
            const newMessages: ChatMessage[] = []
            for (const msg of history) {
                if (msg.messageId && !seenMessageIds.value.has(msg.messageId)) {
                    seenMessageIds.value.add(msg.messageId)
                    newMessages.push(msg)
                }
            }
            if (newMessages.length === 0) {
                console.log('[signalr]历史消息全部已存在，无需更新')
                return
            }
            const mergedForRoom = [...existingForRoom, ...newMessages].sort((a, b) =>
                new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
            )
            messages.value = [...existingForOtherRooms, ...mergedForRoom]
            // 更新该房间最后收到消息的时间戳
            const last = newMessages[newMessages.length - 1]
            if (last) {
                const ts = new Date(last.sentAt).getTime()
                const existing = lastReceivedTimes.value[roomName]
                if (existing === undefined || ts > existing) {
                    lastReceivedTimes.value[roomName] = ts
                }
            }
        })

        await conn.start()
        connection.value = conn
        connectionState.value = conn.state
        console.log('[signalr]连接已建立', conn.connectionId)
        return conn
    }

    async function stopConnection(): Promise<void> {
        if (connection.value) {
            try {
                await connection.value.stop()
            } catch (e) {
                console.error('[signalr]停止连接失败', e)
            }
            connection.value = null
            connectionState.value = HubConnectionState.Disconnected
            joinedRooms.value.clear()
        }
    }

    async function rejoinRooms(): Promise<void> {
        if (!connection.value) return
        console.log('[signalr]开始重新加入房间', [...joinedRooms.value])
        for (const room of joinedRooms.value) {
            try {
                await connection.value.invoke("SyncHistory", room)
                await connection.value.invoke("JoinRoom", room)
                console.log(`[signalr]已重新加入房间 ${room}`)
            } catch (e) {
                console.error(`[signalr]重新加入房间 ${room} 失败`, e)
                joinedRooms.value.delete(room)
            }
        }
    }

    async function joinRoom(roomName: string): Promise<boolean> {
        if (!roomName.trim()) return false
        try {
            const conn = await ensureConnected()
            console.log(`[signalr]正在加入房间 ${roomName}`)
            await conn.invoke("JoinRoom", roomName.trim())
            joinedRooms.value.add(roomName.trim())
            console.log(`[signalr]已加入房间 ${roomName}`)
            return true
        } catch (e: any) {
            error.value = e?.message ?? '加入房间失败'
            console.error(`[signalr]加入房间 ${roomName} 失败`, e)
            return false
        }
    }

    async function syncHistory(roomName: string): Promise<boolean> {
        if (!roomName.trim() || !connection.value) return false
        try {
            console.log(`[signalr]正在同步历史 ${roomName}`)
            await connection.value.invoke("SyncHistory", roomName.trim())
            return true
        } catch (e: any) {
            error.value = e?.message ?? '同步历史消息失败'
            console.error(`[signalr]同步历史 ${roomName} 失败`, e)
            return false
        }
    }

    async function leaveRoom(roomName: string): Promise<boolean> {
        if (!roomName.trim() || !connection.value) return false
        try {
            console.log(`[signalr]正在退出房间 ${roomName}`)
            await connection.value.invoke("LeaveRoom", roomName.trim())
            joinedRooms.value.delete(roomName.trim())
            console.log(`[signalr]已退出房间 ${roomName}`)
            return true
        } catch (e: any) {
            error.value = e?.message ?? '退出房间失败'
            console.error(`[signalr]退出房间 ${roomName} 失败`, e)
            return false
        }
    }

    async function sendMessage(roomName: string, content: string): Promise<boolean> {
        if (!roomName.trim() || !content.trim()) return false
        try {
            const conn = await ensureConnected()
            console.log(`[signalr]发送消息 [${roomName}]: ${content}`)
            await conn.invoke("SendMessage", roomName.trim(), content.trim())
            return true
        } catch (e: any) {
            error.value = e?.message ?? '发送消息失败'
            console.error(`[signalr]发送消息 [${roomName}] 失败`, e)
            return false
        }
    }

    async function disableChat(roomName: string): Promise<boolean> {
        if (!roomName.trim() || !connection.value) return false
        try {
            console.log(`[signalr]请求禁用房间 ${roomName} 的聊天功能`)
            await connection.value.invoke("DisableChat", roomName.trim())
            disabledRooms.value.add(roomName.trim())
            return true
        } catch (e: any) {
            error.value = e?.message ?? '禁用聊天功能失败'
            console.error(`[signalr]禁用房间 ${roomName} 聊天功能失败`, e)
            return false
        }
    }

    function clearDisabledRoom(roomName: string): void {
        disabledRooms.value.delete(roomName)
    }

    function clearMessages(): void {
        messages.value = []
    }

    function getRoomMessages(roomName: string): ChatMessage[] {
        return messages.value.filter(x => x.roomName === roomName)
    }

    return {
        connection,
        connectionState,
        messages,
        joinedRooms,
        disabledRooms,
        error,
        isConnected,
        startConnection,
        stopConnection,
        joinRoom,
        leaveRoom,
        sendMessage,
        disableChat,
        clearMessages,
        clearDisabledRoom,
        getRoomMessages,
        syncHistory
    }
})
