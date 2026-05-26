import { describe, it, expect } from 'vitest'
import { normalizeSave } from '@/models/save/saveNormalize'
import { Save } from '@/models/save'

describe('normalizeSave', () => {
  it('空对象应创建全新存档', () => {
    const result = normalizeSave({}) as Save
    expect(result.idIncre).toBeGreaterThanOrEqual(1)
    expect(result.points).toEqual([])
    expect(result.lines).toEqual([])
    expect(result.textTags).toBeInstanceOf(Array)
    expect(result.textTags.length).toBeGreaterThan(0)
    expect(result.cvsSize[0]).toBeGreaterThanOrEqual(100)
    expect(result.cvsSize[1]).toBeGreaterThanOrEqual(100)
    expect(result.config).toBeInstanceOf(Object)
    expect(result.meta).toBeInstanceOf(Object)
    expect(result.lineStyles).toBeInstanceOf(Array)
    expect(result.lineStyles!.length).toBeGreaterThanOrEqual(2)
    expect(result.patterns).toBeInstanceOf(Array)
    expect(result.patterns!.length).toBeGreaterThanOrEqual(1)
  })

  it('null 应创建全新存档', () => {
    const result = normalizeSave(null) as Save
    expect(result.points).toEqual([])
    expect(result.lines).toEqual([])
  })

  it('非对象应创建全新存档', () => {
    const result = normalizeSave('string') as Save
    expect(result.points).toEqual([])
    expect(result.lines).toEqual([])
  })

  it('已有基础属性的存档应保留数据并补充缺失属性', () => {
    const existing = {
      idIncre: 5,
      points: [{ id: 1, pos: [0, 0], dir: 0, sta: 0 }],
      lines: [{ id: 2, pts: [1], name: 'test', nameSub: '', color: '#fff', type: 0 }],
      cvsSize: [200, 200],
      textTags: [],
      config: {},
      meta: {}
    }
    const result = normalizeSave(existing) as Save
    // existing.idIncre=5 大于 ensureValidIdIncre 计算的 shouldBe=3，不会被修改
    // upgradeTextTagIcons 调用 2 次 getNewId()，还添加了 defaultDataSources，导致数字+1，5 + 3 = 8
    expect(result.idIncre).toBe(8)
    expect(result.points.length).toBe(1)
    expect(result.lines.length).toBe(1)
    expect(result.cvsSize).toEqual([200, 200])
  })

  it('应删除 points 中的 key 属性', () => {
    const existing = {
      idIncre: 2,
      points: [{ id: 1, pos: [0, 0], dir: 0, sta: 0, key: 'should-be-removed' }],
      lines: [],
      cvsSize: [200, 200],
      textTags: [],
      config: {},
      meta: {}
    }
    const result = normalizeSave(existing) as Save
    expect('key' in result.points[0]).toBe(false)
  })

  it('idIncre 小于实际最大 id+1 时应自动修复', () => {
    const existing = {
      idIncre: 1,
      points: [{ id: 10, pos: [0, 0], dir: 0, sta: 0 }],
      lines: [],
      cvsSize: [200, 200],
      textTags: [],
      config: {},
      meta: {}
    }
    const result = normalizeSave(existing) as Save
    // ensureValidIdIncre 修复为 11，然后 upgradeTextTagIcons 调用两次 getNewId()，还添加了 defaultDataSources，导致数字+1，变为 14
    expect(result.idIncre).toBe(14)
  })

  it('cvsSize 小于最小值时应被限制', () => {
    const existing = {
      idIncre: 2,
      points: [],
      lines: [],
      cvsSize: [50, 50],
      textTags: [],
      config: {},
      meta: {}
    }
    const result = normalizeSave(existing) as Save
    expect(result.cvsSize[0]).toBe(100)
    expect(result.cvsSize[1]).toBe(100)
  })
})
