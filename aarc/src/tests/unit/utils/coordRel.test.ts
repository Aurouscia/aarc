import { describe, it, expect } from 'vitest'
import { coordRel, coordRelDiff, coordRelDir, PosRel } from '@/utils/coordUtils/coordRel'
import { ControlPointDir } from '@/models/save'

describe('coordRelDiff', () => {
  function check(xDiff: number, yDiff: number, expectedPosRel: PosRel, expectedRev: boolean) {
    const res = coordRelDiff(xDiff, yDiff)
    expect(res.posRel).toBe(expectedPosRel)
    expect(res.rev).toBe(expectedRev)
  }

  it('重合点', () => {
    check(0, 0, 's', false)
  })

  it('水平方向', () => {
    check(10, 0, 'l', true)   // a 在 b 右侧
    check(-10, 0, 'l', false) // a 在 b 左侧
  })

  it('垂直方向', () => {
    check(0, 10, 'u', true)   // a 在 b 上方
    check(0, -10, 'u', false) // a 在 b 下方
  })

  it('45° 对角（lu：左上往右下，即 a 在 b 右下方）', () => {
    check(10, 10, 'lu', true)   // a 在 b 右下方
    check(-10, -10, 'lu', false) // a 在 b 左上方
  })

  it('45° 对角（ur：右上往左下，即 a 在 b 右上方）', () => {
    check(-10, 10, 'ur', true)  // a 在 b 右上方
    check(10, -10, 'ur', false) // a 在 b 左下方
  })

  it('llu（a 在 b 右侧且偏下，但非 45°）', () => {
    check(20, 10, 'llu', true)  // a 在 b 右下方，偏水平
    check(-20, -10, 'llu', false)
  })

  it('luu（a 在 b 右侧且偏下，但偏垂直）', () => {
    check(10, 20, 'luu', true)
    check(-10, -20, 'luu', false)
  })

  it('uur（a 在 b 左侧且偏上，偏垂直）', () => {
    check(-10, 20, 'uur', true)
    check(10, -20, 'uur', false)
  })

  it('urr（a 在 b 左侧且偏上，偏水平）', () => {
    check(-20, 10, 'urr', true)
    check(20, -10, 'urr', false)
  })
})

describe('coordRel', () => {
  it('使用坐标直接计算相对关系', () => {
    const res = coordRel([10, 0], [0, 0])
    expect(res.posRel).toBe('l')
    expect(res.rev).toBe(true)
  })
})

describe('coordRelDir', () => {
  it('水平或垂直对齐返回 vertical', () => {
    expect(coordRelDir([0, 0], [10, 0])).toBe(ControlPointDir.vertical)
    expect(coordRelDir([0, 0], [0, 10])).toBe(ControlPointDir.vertical)
  })

  it('倾斜返回 incline', () => {
    expect(coordRelDir([0, 0], [10, 10])).toBe(ControlPointDir.incline)
    expect(coordRelDir([0, 0], [10, 5])).toBe(ControlPointDir.incline)
  })
})
