import { DataSource, LineStyle, Pattern, Save, TextTagIcon } from "../save"

export interface DataSourceFetchResult {
    ok: boolean
    data?: unknown
    errmsg?: string
}

const maxDataSourceResponseBytes = 64 * 1024
const maxDataSourceItemCount = 32

export async function fetchDataSource(url: string): Promise<DataSourceFetchResult> {
    try {
        const res = await fetch(url, { cache: 'no-cache' })
        if (!res.ok) {
            return { ok: false, errmsg: `HTTP ${res.status}` }
        }
        const text = await res.text()
        if (text.length > maxDataSourceResponseBytes) {
            return { ok: false, errmsg: `响应过大(${text.length}B)，上限${maxDataSourceResponseBytes / 1024}KB` }
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
    if (fetchedData.length > maxDataSourceItemCount) {
        report.errors.push(`条目过多(${fetchedData.length}个)，上限${maxDataSourceItemCount}个`)
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
        const result = await fetchDataSource(ds.url)
        if (!result.ok || result.data === undefined) {
            opts?.onError?.(ds, result.errmsg || '未知错误')
            continue
        }
        const report = mergeDataSourceItems(save, getNewId, ds, result.data)
        opts?.onDone?.(ds, report)
    }
}
