import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { localConfigKeyPrefix } from "./common/keyPrefix";

export interface ExternalColorSetEntry {
    name: string
    pri: number
    data: string
}

export interface ExternalColorSetGroup {
    url: string
    items: ExternalColorSetEntry[]
    lastAccessed: number
}

export const useExternalColorSetsStore = defineStore('externalColorSets', () => {
    const groups = ref<Record<string, ExternalColorSetGroup>>({})

    const allEntries = computed<ExternalColorSetEntry[]>(() => {
        const res: ExternalColorSetEntry[] = []
        for (const g of Object.values(groups.value)) {
            res.push(...g.items)
        }
        return res
    })

    function getVisibleColorSets(urls: string[]): ExternalColorSetEntry[] {
        const res: ExternalColorSetEntry[] = []
        for (const url of urls) {
            const group = groups.value[url]
            if (group) {
                group.lastAccessed = Date.now()
                res.push(...group.items)
            }
        }
        return res
    }

    function getAllColorSets(): ExternalColorSetEntry[] {
        return allEntries.value
    }

    function getGroup(url: string): ExternalColorSetGroup | undefined {
        return groups.value[url]
    }

    function upsertColorSetGroup(url: string, items: ExternalColorSetEntry[]) {
        groups.value[url] = { url, items: [...items], lastAccessed: Date.now() }
    }

    function removeColorSetGroup(url: string) {
        delete groups.value[url]
    }

    function cleanupHidden(visibleUrls: string[], maxAgeMs: number): number {
        const now = Date.now()
        const visibleSet = new Set(visibleUrls)
        let count = 0
        for (const url of Object.keys(groups.value)) {
            if (visibleSet.has(url)) continue
            if (now - groups.value[url].lastAccessed > maxAgeMs) {
                delete groups.value[url]
                count++
            }
        }
        return count
    }

    return {
        groups,
        allEntries,
        getVisibleColorSets,
        getAllColorSets,
        getGroup,
        upsertColorSetGroup,
        removeColorSetGroup,
        cleanupHidden,
    }
}, {
    persist: {
        key: `${localConfigKeyPrefix}-externalColorSets`
    }
})
