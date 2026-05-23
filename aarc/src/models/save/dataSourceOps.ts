import { DataSource, LineStyle, Pattern, Save, TextTagIcon } from "../save"
import { useExternalColorSetsStore, type ExternalColorSetEntry, type ExternalColorSetGroup } from "@/app/localConfig/externalColorSets"
import { convertToProxyUrlIfNeeded } from "@/utils/urlUtils/proxyUrl"

export interface DataSourceFetchResult {
    ok: boolean
    data?: unknown
    errmsg?: string
}

const maxDataSourceResponseBytes = 64 * 1024
const maxDataSourceColorSetResponseBytes = 128 * 1024
const maxDataSourceItemCount = 32
const maxDataSourceColorSetItemCount = 512

export async function fetchDataSource(url: string, opts?: { isColorSet?: boolean }): Promise<DataSourceFetchResult> {
    try {
        const proxiedUrl = convertToProxyUrlIfNeeded(url, 'json')
        const res = await fetch(proxiedUrl, { cache: 'no-cache' })
        if (!res.ok) {
            return { ok: false, errmsg: `HTTP ${res.status}` }
        }
        const text = await res.text()
        const limit = opts?.isColorSet ? maxDataSourceColorSetResponseBytes : maxDataSourceResponseBytes
        if (text.length > limit) {
            return { ok: false, errmsg: `响应过大(${text.length}B)，上限${limit / 1024}KB` }
        }
        const data = JSON.parse(text)
        return { ok: true, data }
    } catch (e) {
        return { ok: false, errmsg: e instanceof Error ? e.message : String(e) }
    }
}

export interface DataSourceMergeReport {
    added: number
    skipped: number
    overwritten: number
    errors: string[]
}

function getExistingItems(save: Save, type: DataSource['type']): (LineStyle | TextTagIcon | Pattern)[] {
    if (type === 'lineStyles') {
        save.lineStyles ??= []
        return save.lineStyles
    }
    if (type === 'textTagIcons') {
        save.textTagIcons ??= []
        return save.textTagIcons
    }
    if (type === 'colorSets') {
        throw new Error('colorSets 类型不应通过 getExistingItems 获取')
    }
    save.patterns ??= []
    return save.patterns
}

export function mergeDataSourceItems(
    save: Save,
    getNewId: () => number,
    ds: DataSource,
    fetchedData: unknown
): DataSourceMergeReport {
    const report: DataSourceMergeReport = { added: 0, skipped: 0, overwritten: 0, errors: [] }
    if (!Array.isArray(fetchedData)) {
        report.errors.push('数据不是数组')
        return report
    }
    const itemLimit = ds.type === 'colorSets' ? maxDataSourceColorSetItemCount : maxDataSourceItemCount
    if (fetchedData.length > itemLimit) {
        report.errors.push(`条目过多(${fetchedData.length}个)，上限${itemLimit}个`)
        return report
    }

    const existing = getExistingItems(save, ds.type)
    const existingByName = new Map<string, number>()
    existing.forEach((x, idx) => {
        const name = (x as { name?: string }).name
        if (name && !existingByName.has(name)) {
            existingByName.set(name, idx)
        }
    })

    for (const item of fetchedData) {
        if (!item || typeof item !== 'object') {
            report.skipped++
            continue
        }
        const name = (item as Record<string, unknown>).name
        const cloned = JSON.parse(JSON.stringify(item))
        ;(cloned as { id: number }).id = getNewId()

        if (typeof name === 'string' && existingByName.has(name)) {
            if (ds.overwriteSameName) {
                const idx = existingByName.get(name)!
                existing[idx] = cloned as never
                report.overwritten++
            } else {
                report.skipped++
            }
            continue
        }

        existing.push(cloned as never)
        if (typeof name === 'string') {
            existingByName.set(name, existing.length - 1)
        }
        report.added++
    }

    return report
}

export interface ColorSetSourceItem {
    name: string
    pri: number | string
    content: string
}

export function mergeColorSourceItems(
    ds: DataSource,
    fetchedData: unknown,
    existingGroup: ExternalColorSetGroup | undefined
): DataSourceMergeReport {
    const report: DataSourceMergeReport = { added: 0, skipped: 0, overwritten: 0, errors: [] }
    console.log('[mergeColorSourceItems] ds:', ds.name, 'url:', ds.url, 'overwriteSameName:', ds.overwriteSameName)
    if (!Array.isArray(fetchedData)) {
        console.log('[mergeColorSourceItems] 数据不是数组:', fetchedData)
        report.errors.push('数据不是数组')
        return report
    }
    console.log('[mergeColorSourceItems] fetchedData length:', fetchedData.length)
    const itemLimit = ds.type === 'colorSets' ? maxDataSourceColorSetItemCount : maxDataSourceItemCount
    if (fetchedData.length > itemLimit) {
        report.errors.push(`条目过多(${fetchedData.length}个)，上限${itemLimit}个`)
        return report
    }

    const existingByName = new Map<string, boolean>()
    if (existingGroup) {
        existingGroup.items.forEach(x => {
            if (x.name) {
                existingByName.set(x.name, true)
            }
        })
    }

    const items: ExternalColorSetEntry[] = []

    for (const item of fetchedData) {
        if (!item || typeof item !== 'object') {
            report.skipped++
            continue
        }
        const raw = item as Record<string, unknown>
        const name = raw.name
        const pri = raw.pri
        const content = raw.content
        if (typeof name !== 'string' || (typeof pri !== 'number' && typeof pri !== 'string') || typeof content !== 'string') {
            console.log('[mergeColorSourceItems] 字段校验失败:', { name, pri, content, nameType: typeof name, priType: typeof pri, contentType: typeof content })
            report.skipped++
            continue
        }
        const priNum = typeof pri === 'string' ? parseInt(pri, 10) : pri
        if (isNaN(priNum)) {
            console.log('[mergeColorSourceItems] pri 解析失败:', pri)
            report.skipped++
            continue
        }
        console.log('[mergeColorSourceItems] 处理条目:', name, 'pri:', priNum)

        items.push({ name, pri: priNum, data: content })
        if (existingByName.has(name)) {
            report.overwritten++
        } else {
            existingByName.set(name, true)
            report.added++
        }
    }

    console.log('[mergeColorSourceItems] 结果:', { added: report.added, skipped: report.skipped, overwritten: report.overwritten, errors: report.errors })
    return { ...report, _items: items, _url: ds.url } as DataSourceMergeReport & { _items: ExternalColorSetEntry[], _url: string }
}

export function applyColorSourceMerges(url: string, items: ExternalColorSetEntry[]) {
    const store = useExternalColorSetsStore()
    console.log('[applyColorSourceMerges] url:', url, 'items count:', items.length)
    store.upsertColorSetGroup(url, items)
}

export async function autoUpdateDataSources(
    save: Save,
    getNewId: () => number,
    opts?: {
        onLoad?: (ds: DataSource) => void
        onDone?: (ds: DataSource, report: DataSourceMergeReport) => void
        onError?: (ds: DataSource, errmsg: string) => void
    }
) {
    const dss = save.dataSources
    if (!dss || dss.length === 0) return

    for (const ds of dss) {
        if (!ds.autoUpdate) continue
        opts?.onLoad?.(ds)
        const result = await fetchDataSource(ds.url, { isColorSet: ds.type === 'colorSets' })
        if (!result.ok || result.data === undefined) {
            opts?.onError?.(ds, result.errmsg || '未知错误')
            continue
        }
        if (ds.type === 'colorSets') {
            const store = useExternalColorSetsStore()
            const mergeReport = mergeColorSourceItems(ds, result.data, store.getGroup(ds.url))
            const items = (mergeReport as DataSourceMergeReport & { _items?: ExternalColorSetEntry[] })._items
            const url = (mergeReport as DataSourceMergeReport & { _url?: string })._url
            if (items && url) {
                applyColorSourceMerges(url, items)
            }
            opts?.onDone?.(ds, mergeReport)
        } else {
            const report = mergeDataSourceItems(save, getNewId, ds, result.data)
            opts?.onDone?.(ds, report)
        }
    }
}
