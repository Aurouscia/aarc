import { describe, it, expect } from 'vitest'
import {
    initColorSetMeta,
    parseColorSetData,
    loadAndMergeColorSets,
    type BuiltInColorSet,
    type ColorSetExtended,
    type ExternalColorSetGroup,
    type DataSourceRef,
} from '@/components/sidebars/colorPalette'

describe('initColorSetMeta', () => {
    it('应为内置颜色集正确设置 isFictional', () => {
        const sets: ColorSetExtended[] = [
            { name: '北京', pri: 0, data: '北京地铁\n1:#ff0000', isExternal: false },
            { name: '架空城', pri: 500, data: '关键词\n1:#ff0000', isExternal: false },
        ]
        initColorSetMeta(sets)
        expect(sets[0].isFictional).toBe(false)
        expect(sets[1].isFictional).toBe(true)
    })

    it('应为外部颜色集正确设置 isFictional（pri + 0.5 时取 floor）', () => {
        const sets: ColorSetExtended[] = [
            { name: '外部真实', pri: 10.5, data: '关键词\n1:#ff0000', isExternal: true },
            { name: '外部架空', pri: 500.5, data: '关键词\n1:#ff0000', isExternal: true },
        ]
        initColorSetMeta(sets)
        expect(sets[0].isFictional).toBe(false)
        expect(sets[1].isFictional).toBe(true)
    })

    it('应从 data 第一行提取 keywords', () => {
        const sets: ColorSetExtended[] = [
            { name: '北京', pri: 0, data: '北京地铁/bjdt\n1:#ff0000', isExternal: false },
        ]
        initColorSetMeta(sets)
        expect(sets[0].keywords).toBe('北京地铁/bjdt')
    })

    it('应跳过开头的空白字符', () => {
        const sets: ColorSetExtended[] = [
            { name: 'Test', pri: 0, data: '  \t\n关键词\n1:#ff0000', isExternal: false },
        ]
        initColorSetMeta(sets)
        expect(sets[0].keywords).toBe('关键词')
    })

    it('全空白 data 应设置 keywords 为 #', () => {
        const sets: ColorSetExtended[] = [
            { name: 'Empty', pri: 0, data: '   ', isExternal: false },
        ]
        initColorSetMeta(sets)
        expect(sets[0].keywords).toBe('#')
    })
})

describe('parseColorSetData', () => {
    it('应正确解析颜色条目', () => {
        const items = parseColorSetData('关键词\n1:#ff0000\n2:#00ff00')
        expect(items.length).toBe(2)
        expect(items[0]).toEqual({ name: '1', subname: undefined, isUnofficial: false, color: '#ff0000', colorInv: '' })
        expect(items[1]).toEqual({ name: '2', subname: undefined, isUnofficial: false, color: '#00ff00', colorInv: '' })
    })

    it('应识别非官方标记 *', () => {
        const items = parseColorSetData('关键词\n*3:#ff0000')
        expect(items[0].isUnofficial).toBe(true)
        expect(items[0].name).toBe('3')
    })

    it('应提取括号内的副名', () => {
        const items = parseColorSetData('关键词\n1号线(一期):#ff0000')
        expect(items[0].name).toBe('1号线')
        expect(items[0].subname).toBe('一期')
    })

    it('应忽略空行', () => {
        const items = parseColorSetData('关键词\n\n1:#ff0000\n\n2:#00ff00\n')
        expect(items.length).toBe(2)
    })

    it('无冒号的行应被忽略', () => {
        const items = parseColorSetData('关键词\n1:#ff0000\ninvalid line\n2:#00ff00')
        expect(items.length).toBe(2)
    })
})

describe('loadAndMergeColorSets', () => {
    function makeBuiltIn(name: string, pri: number): BuiltInColorSet {
        return { name, pri, data: `${name}\nred:#ff0000` }
    }

    function makeGroup(items: { name: string; pri: number; data?: string }[]): ExternalColorSetGroup {
        return {
            url: 'https://test.com/colors.json',
            items: items.map(x => ({ name: x.name, pri: x.pri, data: x.data ?? `${x.name}\nred:#ff0000` })),
            lastAccessed: 0,
        }
    }

    it('应返回内置颜色集（无外部数据源时）', () => {
        const builtIn = [makeBuiltIn('北京', 0), makeBuiltIn('上海', 1)]
        const result = loadAndMergeColorSets(builtIn, {}, [])
        expect(result.length).toBe(2)
        expect(result[0].name).toBe('北京')
        expect(result[1].name).toBe('上海')
        expect(result[0].isExternal).toBe(false)
    })

    it('应按 dataSources 顺序追加外部颜色集', () => {
        const builtIn = [makeBuiltIn('北京', 0)]
        const groups: Record<string, ExternalColorSetGroup> = {
            'https://a.com/1.json': makeGroup([{ name: '外部A', pri: 10 }]),
            'https://a.com/2.json': makeGroup([{ name: '外部B', pri: 20 }]),
        }
        const dss: DataSourceRef[] = [
            { url: 'https://a.com/1.json', type: 'colorSets' },
            { url: 'https://a.com/2.json', type: 'colorSets' },
        ]
        const result = loadAndMergeColorSets(builtIn, groups, dss)
        expect(result.length).toBe(3)
        expect(result[0].name).toBe('北京')
        expect(result[1].name).toBe('外部A')
        expect(result[2].name).toBe('外部B')
        expect(result[1].pri).toBe(10.5)
        expect(result[2].pri).toBe(20.5)
    })

    it('同名且无 overwrite 时应按顺序去重保留前者', () => {
        const builtIn = [makeBuiltIn('北京', 0)]
        const groups: Record<string, ExternalColorSetGroup> = {
            'https://a.com/1.json': makeGroup([{ name: '北京', pri: 10 }]),
        }
        const dss: DataSourceRef[] = [
            { url: 'https://a.com/1.json', type: 'colorSets', overwriteSameName: false },
        ]
        const result = loadAndMergeColorSets(builtIn, groups, dss)
        expect(result.length).toBe(1)
        expect(result[0].name).toBe('北京')
        expect(result[0].isExternal).toBe(false)
    })

    it('overwrite 数据源应覆盖后面的同名内置颜色集', () => {
        const builtIn = [makeBuiltIn('北京', 0), makeBuiltIn('上海', 1)]
        const groups: Record<string, ExternalColorSetGroup> = {
            'https://a.com/1.json': makeGroup([{ name: '北京', pri: 10 }]),
        }
        const dss: DataSourceRef[] = [
            { url: 'https://a.com/1.json', type: 'colorSets', overwriteSameName: true },
        ]
        const result = loadAndMergeColorSets(builtIn, groups, dss)
        expect(result.length).toBe(2)
        expect(result[0].name).toBe('北京')
        expect(result[0].isExternal).toBe(true)
        expect(result[0].sourceUrl).toBe('https://a.com/1.json')
        expect(result[1].name).toBe('上海')
    })

    it('overwrite 数据源应覆盖后面的同名外部颜色集', () => {
        const builtIn: BuiltInColorSet[] = []
        const groups: Record<string, ExternalColorSetGroup> = {
            'https://a.com/1.json': makeGroup([{ name: '北京', pri: 10 }]),
            'https://a.com/2.json': makeGroup([{ name: '北京', pri: 20 }]),
        }
        const dss: DataSourceRef[] = [
            { url: 'https://a.com/1.json', type: 'colorSets', overwriteSameName: true },
            { url: 'https://a.com/2.json', type: 'colorSets' },
        ]
        const result = loadAndMergeColorSets(builtIn, groups, dss)
        expect(result.length).toBe(1)
        expect(result[0].name).toBe('北京')
        expect(result[0].pri).toBe(10.5)
    })

    it('排在前面的 overwrite 数据源优先于后面的 overwrite 数据源', () => {
        const builtIn: BuiltInColorSet[] = []
        const groups: Record<string, ExternalColorSetGroup> = {
            'https://a.com/1.json': makeGroup([{ name: '北京', pri: 10 }]),
            'https://a.com/2.json': makeGroup([{ name: '北京', pri: 20 }]),
        }
        const dss: DataSourceRef[] = [
            { url: 'https://a.com/1.json', type: 'colorSets', overwriteSameName: true },
            { url: 'https://a.com/2.json', type: 'colorSets', overwriteSameName: true },
        ]
        const result = loadAndMergeColorSets(builtIn, groups, dss)
        expect(result.length).toBe(1)
        // 两个 overwrite 数据源，后面的替换前面的，所以保留后面的
        expect(result[0].pri).toBe(20.5)
    })

    it('非 colorSets 类型的数据源应被忽略', () => {
        const builtIn = [makeBuiltIn('北京', 0)]
        const dss: DataSourceRef[] = [
            { url: 'https://a.com/1.json', type: 'lineStyles' },
        ]
        const result = loadAndMergeColorSets(builtIn, {}, dss)
        expect(result.length).toBe(1)
        expect(result[0].name).toBe('北京')
    })

    it('外部 group 不存在时应跳过', () => {
        const builtIn = [makeBuiltIn('北京', 0)]
        const dss: DataSourceRef[] = [
            { url: 'https://a.com/missing.json', type: 'colorSets' },
        ]
        const result = loadAndMergeColorSets(builtIn, {}, dss)
        expect(result.length).toBe(1)
    })
})
