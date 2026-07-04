import { defineStore } from "pinia"
import { ref } from "vue"

const storeId = 'kickedFromCanvas'
const gcExpireHours = 1

export const useKickedFromCanvasStore = defineStore(storeId, () => {
    // saveId -> 被踢出提示出现的时间（Unix 时间戳，毫秒）
    const records = ref<Record<number, number>>({})

    function markKicked(saveId: number, time: number = Date.now()) {
        records.value[saveId] = time
        gc()
    }

    function getKickedTime(saveId: number): number | undefined {
        gc()
        return records.value[saveId]
    }

    /**
     * 判断当前是否仍处于被踢出的宽限期内。
     * 每次调用都会自动清理所有过期记录，避免数据越堆越多。
     * @param saveId 存档 Id
     * @param waitMs 宽限时长（毫秒）
     */
    function isStillKicked(saveId: number, waitMs: number): boolean {
        const t = records.value[saveId]
        const stillKicked = t !== undefined && Date.now() - t < waitMs
        if (t !== undefined && !stillKicked) {
            delete records.value[saveId]
        }
        gc()
        return stillKicked
    }

    function gc() {
        const now = Date.now()
        const expireMs = gcExpireHours * 60 * 60 * 1000
        for (const id in records.value) {
            const t = records.value[id]
            if (now - t > expireMs) {
                delete records.value[id]
            }
        }
    }

    return {
        records,
        markKicked,
        getKickedTime,
        isStillKicked,
        gc
    }
}, {
    persist: {
        key: `aarc-${storeId}`,
        pick: ['records']
    }
})
