import { DataSource, Save } from "@/models/save"

export function deduplicateDataSources(dataSources: unknown[]): DataSource[] {
    const seenUrls = new Set<string>()
    return dataSources.filter((ds: unknown): ds is DataSource => {
        if (!ds || typeof ds !== 'object') return false
        const d = ds as Record<string, unknown>
        if (typeof d.url === 'string') {
            if (seenUrls.has(d.url)) return false
            seenUrls.add(d.url)
        }
        return true
    })
}

export function ensureValidDataSources(save: Partial<Save>) {
    if (save.dataSources instanceof Array) {
        const beforeCount = save.dataSources.length
        save.dataSources = deduplicateDataSources(save.dataSources)
        const afterCount = save.dataSources.length
        if (afterCount < beforeCount) {
            console.warn(`[规范化]已移除${beforeCount - afterCount}个重复url的数据源`)
        }
    }
}
