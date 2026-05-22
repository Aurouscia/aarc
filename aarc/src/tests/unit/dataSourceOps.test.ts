import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchDataSource, mergeDataSourceItems, autoUpdateDataSources } from '@/models/save/dataSourceOps'
import { DataSource, Save } from '@/models/save'

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
