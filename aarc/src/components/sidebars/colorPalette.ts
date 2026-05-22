import type { ExternalColorSetEntry } from '@/app/localConfig/externalColorSets'

export interface BuiltInColorSet {
    name: string
    pri: number
    data: string
}

export interface ColorSetItem {
    name: string
    subname?: string
    isUnofficial: boolean
    color: string
    colorInv: string
}

export interface ColorSetExtended {
    name: string
    pri: number
    data: string
    showing?: boolean
    items?: ColorSetItem[]
    keywords?: string
    isFictional?: boolean
    isExternal?: boolean
    sourceUrl?: string
}

export function initColorSetMeta(colorSets: ColorSetExtended[]) {
    const EMPTY = new Set([' ', '\t', '\n'])
    colorSets.forEach(s => {
        s.isFictional = (s.isExternal ? Math.floor(s.pri) >= 500 : s.pri >= 500)
        if (s.data) {
            const len = s.data.length
            let i = 0
            while (i < len && EMPTY.has(s.data[i]))
                ++i
            if (i < len) {
                let nl = s.data.indexOf('\n', i)
                if (nl === -1)
                    nl = len
                s.keywords = s.data.slice(i, nl).trim()
            } else {
                s.keywords = '#'
            }
        }
    })
}

const parenthesisAndContent = /\([^\(\)]*(?:\([^\(\)]*\)[^\(\)]*)*\)/
const parenthesisContent = /(?<=\().*(?=\))/

export function parseColorSetData(data: string): ColorSetItem[] {
    const res: ColorSetItem[] = []
    const rows = data.split('\n').filter(x => !!x)
    for (let i = 1; i < rows.length; i++) {
        const row = rows.at(i)?.trim()
        if (!row)
            continue
        let [name, color] = row.split(':')
        if (name && color) {
            let isUnofficial = false
            if (name.includes('*')) {
                isUnofficial = true
                name = name.replace('*', '')
            }
            const nameMain = name.replace(parenthesisAndContent, '')
            const nameSub = name.match(parenthesisContent)?.at(0)
            res.push({
                name: nameMain,
                subname: nameSub,
                isUnofficial,
                color,
                colorInv: '' // 由调用方填充
            })
        }
    }
    return res
}

export interface ExternalColorSetGroup {
    url: string
    items: ExternalColorSetEntry[]
    lastAccessed: number
}

export interface DataSourceRef {
    url: string
    type: string
    overwriteSameName?: boolean
}

/**
 * 加载并合并内置和外部颜色集
 *
 * 合并规则：
 * 1. 内置颜色集排在最前面
 * 2. 外部颜色集按 save.dataSources 中的顺序排列
 * 3. 排在前面的更优先
 * 4. 如果某数据源 overwriteSameName=true，则它的颜色集会阻塞（覆盖）后面所有同名颜色集
 * 5. 如果没有数据源开启 overwriteSameName，则同名颜色集并存
 */
export function loadAndMergeColorSets(
    builtIn: BuiltInColorSet[],
    externalGroups: Record<string, ExternalColorSetGroup>,
    saveDataSources: DataSourceRef[]
): ColorSetExtended[] {
    const colorSetDsList = saveDataSources.filter(ds => ds.type === 'colorSets')

    // 1. 收集所有颜色集，按顺序：内置先，然后按 dataSources 顺序的外部
    const allColorSets: ColorSetExtended[] = []

    for (const b of builtIn) {
        allColorSets.push({
            name: b.name,
            pri: b.pri,
            data: b.data,
            isExternal: false,
        })
    }

    for (const ds of colorSetDsList) {
        const group = externalGroups[ds.url]
        if (group) {
            for (const item of group.items) {
                allColorSets.push({
                    name: item.name,
                    pri: item.pri + 0.5,
                    data: item.data,
                    isExternal: true,
                    sourceUrl: ds.url,
                })
            }
        }
    }

    // 2. 确定哪些数据源开启了 overwrite
    const overwriteUrls = new Set<string>()
    for (const ds of colorSetDsList) {
        if (ds.overwriteSameName) {
            overwriteUrls.add(ds.url)
        }
    }

    // 3. 按顺序遍历，构建最终结果
    // 规则：
    // - overwrite 数据源的颜色集：强制保留，如果 result 中已有同名则替换
    // - 非 overwrite 的颜色集：只有 result 中没有同名时才保留
    const result: ColorSetExtended[] = []
    const nameToIndex = new Map<string, number>()

    for (const cs of allColorSets) {
        const isOverwrite = cs.isExternal && cs.sourceUrl && overwriteUrls.has(cs.sourceUrl)
        const existingIdx = nameToIndex.get(cs.name)
        if (isOverwrite) {
            // overwrite：强制保留，替换已有同名
            if (existingIdx !== undefined) {
                result[existingIdx] = cs
            } else {
                nameToIndex.set(cs.name, result.length)
                result.push(cs)
            }
        } else if (existingIdx === undefined) {
            // 非 overwrite，且没有同名：保留
            nameToIndex.set(cs.name, result.length)
            result.push(cs)
        }
        // 否则：非 overwrite 且已有同名，跳过
    }

    return result
}
