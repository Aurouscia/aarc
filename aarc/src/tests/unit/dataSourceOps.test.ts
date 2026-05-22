import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchDataSource, mergeDataSourceItems, mergeColorSourceItems, autoUpdateDataSources } from '@/models/save/dataSourceOps'
import { DataSource, Save } from '@/models/save'
import type { ExternalColorSetEntry, ExternalColorSetGroup } from '@/app/localConfig/externalColorSets'

describe('fetchDataSource', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('应返回 JSON 数据', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify([{ name: 'test' }]),
    } as Response)

    const result = await fetchDataSource('https://example.com/data.json')
    expect(result.ok).toBe(true)
    expect(result.data).toEqual([{ name: 'test' }])
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/data.json', { cache: 'no-cache' })
  })

  it('HTTP 错误应返回 errmsg', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response)

    const result = await fetchDataSource('https://example.com/404.json')
    expect(result.ok).toBe(false)
    expect(result.errmsg).toBe('HTTP 404')
  })

  it('响应超过64KB应拒绝', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'x'.repeat(64 * 1024 + 1),
    } as Response)

    const result = await fetchDataSource('https://example.com/huge.json')
    expect(result.ok).toBe(false)
    expect(result.errmsg).toContain('响应过大')
    expect(result.errmsg).toContain('64')
  })

  it('颜色集响应超过128KB应拒绝', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'x'.repeat(128 * 1024 + 1),
    } as Response)

    const result = await fetchDataSource('https://example.com/colors.json', { isColorSet: true })
    expect(result.ok).toBe(false)
    expect(result.errmsg).toContain('响应过大')
    expect(result.errmsg).toContain('128')
  })

  it('颜色集响应在128KB内应通过', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify([{ name: 'test', pri: 0, content: 'x' }]).padEnd(128 * 1024, ' '),
    } as Response)

    const result = await fetchDataSource('https://example.com/colors.json', { isColorSet: true })
    expect(result.ok).toBe(true)
    expect(result.data).toEqual([{ name: 'test', pri: 0, content: 'x' }])
  })

  it('网络异常应返回 errmsg', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockRejectedValueOnce(new Error('Network Error'))

    const result = await fetchDataSource('https://example.com/data.json')
    expect(result.ok).toBe(false)
    expect(result.errmsg).toBe('Network Error')
  })

  it('JSON 解析失败应返回 errmsg', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => 'not valid json {',
    } as Response)

    const result = await fetchDataSource('https://example.com/bad.json')
    expect(result.ok).toBe(false)
    expect(result.errmsg).toContain('JSON')
  })
})

describe('mergeDataSourceItems', () => {
  function makeSave(): Save {
    return {
      idIncre: 10,
      points: [],
      lines: [],
      textTags: [],
      cvsSize: [1000, 1000],
      config: {},
      meta: {},
      lineStyles: [
        { id: 1, name: '快线', layers: [] },
      ],
    }
  }

  function makeGetNewId(start = 99) {
    let id = start
    return () => id++
  }

  it('应添加新项并分配递增ID', () => {
    const save = makeSave()
    const ds: DataSource = { id: 1, url: '', type: 'lineStyles' }
    const getNewId = makeGetNewId()
    const report = mergeDataSourceItems(save, getNewId, ds, [
      { name: '铁路', layers: [{ color: '#fff', width: 1 }] },
      { name: '地铁', layers: [{ color: '#000', width: 2 }] },
    ])
    expect(report.added).toBe(2)
    expect(report.skipped).toBe(0)
    expect(report.overwritten).toBe(0)
    expect(save.lineStyles!.length).toBe(3)
    expect(save.lineStyles![1].name).toBe('铁路')
    expect(save.lineStyles![1].id).toBe(99)
    expect(save.lineStyles![2].name).toBe('地铁')
    expect(save.lineStyles![2].id).toBe(100)
  })

  it('同名且 overwriteSameName=false 应跳过', () => {
    const save = makeSave()
    const ds: DataSource = { id: 1, url: '', type: 'lineStyles' }
    const report = mergeDataSourceItems(save, makeGetNewId(), ds, [
      { name: '快线', layers: [{ color: '#000' }] },
    ])
    expect(report.added).toBe(0)
    expect(report.skipped).toBe(1)
    expect(report.overwritten).toBe(0)
    expect(save.lineStyles!.length).toBe(1)
    expect(save.lineStyles![0].layers).toEqual([])
  })

  it('同名且 overwriteSameName=true 应覆盖并分配新ID', () => {
    const save = makeSave()
    const ds: DataSource = { id: 1, url: '', type: 'lineStyles', overwriteSameName: true }
    const report = mergeDataSourceItems(save, makeGetNewId(200), ds, [
      { name: '快线', layers: [{ color: '#000' }] },
    ])
    expect(report.added).toBe(0)
    expect(report.skipped).toBe(0)
    expect(report.overwritten).toBe(1)
    expect(save.lineStyles!.length).toBe(1)
    expect(save.lineStyles![0].layers).toEqual([{ color: '#000' }])
    expect(save.lineStyles![0].id).toBe(200)
  })

  it('非数组数据应报错', () => {
    const save = makeSave()
    const ds: DataSource = { id: 1, url: '', type: 'lineStyles' }
    const report = mergeDataSourceItems(save, makeGetNewId(), ds, { name: 'test' })
    expect(report.errors.length).toBeGreaterThan(0)
    expect(report.added).toBe(0)
  })

  it('条目超过32个应拒绝', () => {
    const save = makeSave()
    const ds: DataSource = { id: 1, url: '', type: 'lineStyles' }
    const items = Array.from({ length: 33 }, (_, i) => ({ name: `item${i}`, layers: [] }))
    const report = mergeDataSourceItems(save, makeGetNewId(), ds, items)
    expect(report.errors.length).toBeGreaterThan(0)
    expect(report.errors[0]).toContain('条目过多')
    expect(report.added).toBe(0)
    expect(save.lineStyles!.length).toBe(1)
  })

  it('非对象条目应跳过', () => {
    const save = makeSave()
    const ds: DataSource = { id: 1, url: '', type: 'lineStyles' }
    const report = mergeDataSourceItems(save, makeGetNewId(), ds, [
      null,
      'string item',
      42,
      { name: 'valid', layers: [] },
    ])
    expect(report.skipped).toBe(3)
    expect(report.added).toBe(1)
    expect(save.lineStyles!.length).toBe(2)
    expect(save.lineStyles![1].name).toBe('valid')
  })

  it('无 name 或 name 非字符串的条目应添加但不参与同名判断', () => {
    const save = makeSave()
    const ds: DataSource = { id: 1, url: '', type: 'lineStyles' }
    const getNewId = makeGetNewId()
    const report = mergeDataSourceItems(save, getNewId, ds, [
      { layers: [{ color: '#fff' }] },
      { name: 123, layers: [] },
      { name: '快线', layers: [{ color: '#000' }] },
    ])
    expect(report.added).toBe(2)
    expect(report.skipped).toBe(1)
    expect(save.lineStyles!.length).toBe(3)
    expect(save.lineStyles![1].name).toBeUndefined()
    expect(save.lineStyles![1].id).toBe(99)
    expect(save.lineStyles![2].name).toBe(123)
    expect(save.lineStyles![2].id).toBe(100)
    expect(save.lineStyles![0].layers).toEqual([])
  })
})

describe('autoUpdateDataSources', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('只处理 autoUpdate=true 的数据源', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify([{ name: 'newStyle', layers: [] }]),
    } as Response)

    const save: Save = {
      idIncre: 10,
      points: [],
      lines: [],
      textTags: [],
      cvsSize: [1000, 1000],
      config: {},
      meta: {},
      lineStyles: [],
      dataSources: [
        { id: 1, url: 'https://a.com/1.json', type: 'lineStyles', autoUpdate: true },
        { id: 2, url: 'https://a.com/2.json', type: 'lineStyles', autoUpdate: false },
      ],
    }

    const onDone = vi.fn()
    await autoUpdateDataSources(save, () => 99, { onDone })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith('https://a.com/1.json', { cache: 'no-cache' })
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(save.lineStyles!.length).toBe(1)
  })

  it('fetch 失败应调用 onError', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockRejectedValueOnce(new Error('fail'))

    const save: Save = {
      idIncre: 10,
      points: [],
      lines: [],
      textTags: [],
      cvsSize: [1000, 1000],
      config: {},
      meta: {},
      dataSources: [
        { id: 1, url: 'https://a.com/1.json', type: 'lineStyles', autoUpdate: true },
      ],
    }

    const onError = vi.fn()
    await autoUpdateDataSources(save, () => 99, { onError })

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      'fail'
    )
  })

  it('应调用 onLoad 回调', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify([{ name: 'newStyle', layers: [] }]),
    } as Response)

    const save: Save = {
      idIncre: 10,
      points: [],
      lines: [],
      textTags: [],
      cvsSize: [1000, 1000],
      config: {},
      meta: {},
      dataSources: [
        { id: 1, url: 'https://a.com/1.json', type: 'lineStyles', autoUpdate: true },
      ],
    }

    const onLoad = vi.fn()
    await autoUpdateDataSources(save, () => 99, { onLoad })

    expect(onLoad).toHaveBeenCalledTimes(1)
    expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })
})

describe('mergeColorSourceItems', () => {
  function makeGroup(items: ExternalColorSetEntry[]): ExternalColorSetGroup {
    return { url: 'https://a.com/colors.json', items, lastAccessed: 0 }
  }

  it('应添加颜色集到 store', () => {
    const ds: DataSource = { id: 1, url: 'https://a.com/colors.json', type: 'colorSets' }
    const report = mergeColorSourceItems(ds, [
      { name: '北京', pri: 0, content: '北京地铁\n1:#ff0000' },
      { name: '上海', pri: 1, content: '上海地铁\n2:#00ff00' },
    ], undefined)
    expect(report.added).toBe(2)
    expect(report.skipped).toBe(0)
    expect(report.overwritten).toBe(0)
    const items = (report as typeof report & { _items?: unknown[] })._items
    expect(items?.length).toBe(2)
  })

  it('非对象条目应跳过', () => {
    const ds: DataSource = { id: 1, url: 'https://a.com/colors.json', type: 'colorSets' }
    const report = mergeColorSourceItems(ds, [
      null,
      'invalid',
      { name: 'Test', pri: 0, content: 'keywords\nred:#ff0000' },
    ], undefined)
    expect(report.skipped).toBe(2)
    expect(report.added).toBe(1)
  })

  it('缺少必要字段应跳过', () => {
    const ds: DataSource = { id: 1, url: 'https://a.com/colors.json', type: 'colorSets' }
    const report = mergeColorSourceItems(ds, [
      { name: 'OnlyName', pri: 0 },
      { pri: 1, content: 'no name' },
      { name: 'Valid', pri: 2, content: 'ok\nred:#ff0000' },
    ], undefined)
    expect(report.skipped).toBe(2)
    expect(report.added).toBe(1)
  })

  it('pri 为字符串时应解析为数字', () => {
    const ds: DataSource = { id: 1, url: 'https://a.com/colors.json', type: 'colorSets' }
    const report = mergeColorSourceItems(ds, [
      { name: 'Test', pri: '42', content: 'keywords\nred:#ff0000' },
    ], undefined)
    expect(report.added).toBe(1)
    expect(report.skipped).toBe(0)
  })

  it('非数组数据应报错', () => {
    const ds: DataSource = { id: 1, url: 'https://a.com/colors.json', type: 'colorSets' }
    const report = mergeColorSourceItems(ds, { name: 'test' }, undefined)
    expect(report.errors.length).toBeGreaterThan(0)
    expect(report.added).toBe(0)
  })

  it('颜色集条目超过512个应拒绝', () => {
    const ds: DataSource = { id: 1, url: 'https://a.com/colors.json', type: 'colorSets' }
    const items = Array.from({ length: 513 }, (_, i) => ({ name: `item${i}`, pri: i, content: 'k\nred:#ff0000' }))
    const report = mergeColorSourceItems(ds, items, undefined)
    expect(report.errors.length).toBeGreaterThan(0)
    expect(report.errors[0]).toContain('条目过多')
    expect(report.errors[0]).toContain('512')
    expect(report.added).toBe(0)
  })

  it('颜色集条目512个应通过', () => {
    const ds: DataSource = { id: 1, url: 'https://a.com/colors.json', type: 'colorSets' }
    const items = Array.from({ length: 512 }, (_, i) => ({ name: `item${i}`, pri: i, content: 'k\nred:#ff0000' }))
    const report = mergeColorSourceItems(ds, items, undefined)
    expect(report.errors.length).toBe(0)
    expect(report.added).toBe(512)
  })

  it('overwriteSameName=false 时应覆盖全部', () => {
    const ds: DataSource = { id: 1, url: 'https://a.com/colors.json', type: 'colorSets', overwriteSameName: false }
    const existing = makeGroup([{ name: '北京', pri: 0, data: 'old' }])
    const report = mergeColorSourceItems(ds, [
      { name: '北京', pri: 0, content: 'new content' },
    ], existing)
    expect(report.added).toBe(0)
    expect(report.skipped).toBe(0)
    expect(report.overwritten).toBe(1)
  })

  it('overwriteSameName=true 时应覆盖同名', () => {
    const ds: DataSource = { id: 1, url: 'https://a.com/colors.json', type: 'colorSets', overwriteSameName: true }
    const existing = makeGroup([{ name: '北京', pri: 0, data: 'old' }])
    const report = mergeColorSourceItems(ds, [
      { name: '北京', pri: 0, content: 'new content' },
    ], existing)
    expect(report.added).toBe(0)
    expect(report.skipped).toBe(0)
    expect(report.overwritten).toBe(1)
    const items = (report as typeof report & { _items?: unknown[] })._items
    expect(items?.length).toBe(1)
  })
})
