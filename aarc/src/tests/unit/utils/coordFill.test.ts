import { describe, it, expect } from 'vitest'
import { coordFill } from '@/utils/coordUtils/coordFill'
import { PosRel } from '@/utils/coordUtils/coordRel'

function fill(
  a: [number, number],
  b: [number, number],
  xDiff: number,
  yDiff: number,
  posRel: PosRel,
  reversed: boolean,
  type: 'top' | 'bottom' | 'midInc' | 'midVert'
) {
  return coordFill(a, b, xDiff, yDiff, posRel, reversed, type)
}

describe('coordFill', () => {
  it('正交或对角（l/u/lu/ur）返回空数组', () => {
    const a: [number, number] = [0, 0]
    const b: [number, number] = [10, 0]
    expect(fill(a, b, -10, 0, 'l', false, 'midInc')).toEqual([])
    expect(fill(a, b, 0, -10, 'u', false, 'midInc')).toEqual([])
    expect(fill(a, b, -10, -10, 'lu', false, 'midInc')).toEqual([])
    expect(fill(a, b, -10, 10, 'ur', false, 'midInc')).toEqual([])
  })

  describe('llu（右下浅斜，a 在 b 左上方）', () => {
    // a(0,0), b(20,10): xDiff=-20, yDiff=-10
    const a: [number, number] = [0, 0]
    const b: [number, number] = [20, 10]
    const xDiff = -20
    const yDiff = -10

    it('top：从 a 向右走 bias', () => {
      // bias = -xDiff + yDiff = 20 - 10 = 10
      expect(fill(a, b, xDiff, yDiff, 'llu', false, 'top')).toEqual([[10, 0]])
    })

    it('bottom：从 b 向左走 bias', () => {
      expect(fill(a, b, xDiff, yDiff, 'llu', false, 'bottom')).toEqual([[10, 10]])
    })

    it('midInc：两端各走 bias/2', () => {
      expect(fill(a, b, xDiff, yDiff, 'llu', false, 'midInc')).toEqual([
        [5, 0],
        [15, 10]
      ])
    })

    it('midVert：沿对角线中分', () => {
      // bias = -yDiff/2 = 5
      expect(fill(a, b, xDiff, yDiff, 'llu', false, 'midVert')).toEqual([
        [5, 5],
        [15, 5]
      ])
    })
  })

  describe('luu（右上浅斜，a 在 b 左下方）', () => {
    // a(0,20), b(20,0): xDiff=-20, yDiff=20
    const a: [number, number] = [0, 20]
    const b: [number, number] = [20, 0]
    const xDiff = -20
    const yDiff = 20

    it('top：从 b 向下走 bias', () => {
      // bias = xDiff - yDiff = -20 - 20 = -40
      expect(fill(a, b, xDiff, yDiff, 'luu', false, 'top')).toEqual([[20, 40]])
    })

    it('bottom：从 a 向上走 bias', () => {
      expect(fill(a, b, xDiff, yDiff, 'luu', false, 'bottom')).toEqual([[0, -20]])
    })

    it('midInc：两端各走 bias/2', () => {
      expect(fill(a, b, xDiff, yDiff, 'luu', false, 'midInc')).toEqual([
        [0, 0],
        [20, 20]
      ])
    })

    it('midVert：沿对角线中分', () => {
      // bias = -xDiff/2 = 10
      expect(fill(a, b, xDiff, yDiff, 'luu', false, 'midVert')).toEqual([
        [10, 30],
        [10, -10]
      ])
    })
  })

  describe('uur（左上浅斜，a 在 b 右下方）', () => {
    // a(20,10), b(0,0): xDiff=20, yDiff=10
    const a: [number, number] = [20, 10]
    const b: [number, number] = [0, 0]
    const xDiff = 20
    const yDiff = 10

    it('top：从 b 向下走 bias', () => {
      // bias = -xDiff - yDiff = -20 - 10 = -30
      expect(fill(a, b, xDiff, yDiff, 'uur', false, 'top')).toEqual([[0, 30]])
    })

    it('bottom：从 a 向上走 bias', () => {
      expect(fill(a, b, xDiff, yDiff, 'uur', false, 'bottom')).toEqual([[20, -20]])
    })

    it('midInc：两端各走 bias/2', () => {
      expect(fill(a, b, xDiff, yDiff, 'uur', false, 'midInc')).toEqual([
        [20, -5],
        [0, 15]
      ])
    })

    it('midVert：沿对角线中分', () => {
      // bias = -xDiff/2 = -10
      expect(fill(a, b, xDiff, yDiff, 'uur', false, 'midVert')).toEqual([
        [10, 20],
        [10, -10]
      ])
    })
  })

  describe('urr（左下浅斜，a 在 b 右上方）', () => {
    // a(20,0), b(0,10): xDiff=20, yDiff=-10
    const a: [number, number] = [20, 0]
    const b: [number, number] = [0, 10]
    const xDiff = 20
    const yDiff = -10

    it('top：从 a 向左走 bias', () => {
      // bias = xDiff + yDiff = 20 - 10 = 10
      expect(fill(a, b, xDiff, yDiff, 'urr', false, 'top')).toEqual([[10, 0]])
    })

    it('bottom：从 b 向右走 bias', () => {
      expect(fill(a, b, xDiff, yDiff, 'urr', false, 'bottom')).toEqual([[10, 10]])
    })

    it('midInc：两端各走 bias/2', () => {
      expect(fill(a, b, xDiff, yDiff, 'urr', false, 'midInc')).toEqual([
        [15, 0],
        [5, 10]
      ])
    })

    it('midVert：沿对角线中分', () => {
      // bias = yDiff/2 = -5
      expect(fill(a, b, xDiff, yDiff, 'urr', false, 'midVert')).toEqual([
        [15, 5],
        [5, 5]
      ])
    })
  })

  it('reversed=true 会反转结果顺序', () => {
    const a: [number, number] = [0, 0]
    const b: [number, number] = [20, 10]
    const xDiff = -20
    const yDiff = -10

    const forward = fill(a, b, xDiff, yDiff, 'llu', false, 'midInc')
    const reversed = fill(a, b, xDiff, yDiff, 'llu', true, 'midInc')

    expect(forward).toEqual([[5, 0], [15, 10]])
    expect(reversed).toEqual([[15, 10], [5, 0]])
  })
})
