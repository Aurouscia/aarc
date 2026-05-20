import { describe, it, expect } from 'vitest'
import { ensureValidCvsSize, minCvsSide } from '@/models/save/valid/cvsSize'
import { ensureValidIdIncre } from '@/models/save/valid/idIncre'
import { Save } from '@/models/save'

describe('ensureValidCvsSize', () => {
  it('尺寸正常时不应修改', () => {
    const save = { cvsSize: [500, 600] } as Save
    ensureValidCvsSize(save)
    expect(save.cvsSize).toEqual([500, 600])
  })

  it('宽度小于最小值时应被限制', () => {
    const save = { cvsSize: [50, 600] } as Save
    ensureValidCvsSize(save)
    expect(save.cvsSize[0]).toBe(minCvsSide)
    expect(save.cvsSize[1]).toBe(600)
  })

  it('高度小于最小值时应被限制', () => {
    const save = { cvsSize: [500, 50] } as Save
    ensureValidCvsSize(save)
    expect(save.cvsSize[0]).toBe(500)
    expect(save.cvsSize[1]).toBe(minCvsSide)
  })

  it('宽高都小于最小值时都应被限制', () => {
    const save = { cvsSize: [10, 20] } as Save
    ensureValidCvsSize(save)
    expect(save.cvsSize[0]).toBe(minCvsSide)
    expect(save.cvsSize[1]).toBe(minCvsSide)
  })
})

describe('ensureValidIdIncre', () => {
  it('idIncre 正确时不应修改', () => {
    const save = {
      idIncre: 5,
      points: [{ id: 1 }, { id: 3 }],
      lines: [{ id: 2 }]
    } as any
    ensureValidIdIncre(save)
    expect(save.idIncre).toBe(5)
  })

  it('idIncre 小于最大 id+1 时应修复', () => {
    const save = {
      idIncre: 2,
      points: [{ id: 1 }, { id: 10 }],
      lines: [{ id: 5 }]
    } as any
    ensureValidIdIncre(save)
    expect(save.idIncre).toBe(11)
  })

  it('空数组时应保持 idIncre 不变', () => {
    const save = {
      idIncre: 1,
      points: [],
      lines: []
    } as any
    ensureValidIdIncre(save)
    expect(save.idIncre).toBe(1)
  })

  it('idIncre 为 0 且没有元素时应设为 1', () => {
    const save = {
      idIncre: 0,
      points: [],
      lines: []
    } as any
    ensureValidIdIncre(save)
    expect(save.idIncre).toBe(1)
  })

  it('应遍历所有数组类型的属性查找最大 id', () => {
    const save = {
      idIncre: 1,
      points: [{ id: 1 }],
      lines: [{ id: 2 }],
      textTags: [{ id: 100 }],
      lineStyles: [{ id: 50 }]
    } as any
    ensureValidIdIncre(save)
    expect(save.idIncre).toBe(101)
  })
})
