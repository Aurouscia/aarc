import { defineStore } from "pinia"
import { computed, ref } from "vue"

const storeId = 'chatMsgsRead'
const gcExpireHours = 12

export const useChatMsgsReadStore = defineStore(storeId, () => {
    // saveId -> 已读的最晚消息时间（Unix 时间戳，毫秒）
    const records = ref<Record<string, number>>({})

    function keyOf(saveId: string | number): string {
        return saveId.toString()
    }

    function toTimestamp(value: string | number | Date): number {
        if (typeof value === 'number') return value
        if (value instanceof Date) return value.getTime()
        return new Date(value).getTime()
    }

    const readTimeOf = computed(() => (saveId: string | number): number | undefined => {
        return records.value[keyOf(saveId)]
    })

    function isRead(saveId: string | number, messageSentAt: string | number | Date): boolean {
        const readTime = records.value[keyOf(saveId)]
        if (readTime === undefined) return false
        return toTimestamp(messageSentAt) <= readTime
    }

    function markRead(saveId: string | number, upToTime?: string | number | Date) {
        const k = keyOf(saveId)
        const newTime = upToTime !== undefined ? toTimestamp(upToTime) : Date.now()
        const existing = records.value[k]
        if (existing === undefined || newTime > existing) {
            records.value[k] = newTime
        }
        gc()
    }

    function gc() {
        const now = Date.now()
        const expireMs = gcExpireHours * 60 * 60 * 1000
        for (const k in records.value) {
            const t = records.value[k]
            if (now - t > expireMs) {
                delete records.value[k]
            }
        }
    }

    return {
        records,
        readTimeOf,
        isRead,
        markRead,
        gc
    }
}, {
    persist: {
        key: `aarc-${storeId}`,
        pick: ['records']
    }
})
