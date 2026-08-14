import { describe, it, expect } from 'vitest'
import { CvsBlock, CvsContext } from '@/models/cvs/common/cvsContext'
import { drawCross } from '@/utils/drawUtils/drawCross'
import { Coord } from '@/models/coord'

type MockCall = { type: string; args: any[]; lineWidth?: number; strokeStyle?: string }

function createMockCtx(scale = 1, x = 0, y = 0) {
  const calls: MockCall[] = []
  const ctx2d: any = {
    moveTo: (...args: any[]) => calls.push({ type: 'moveTo', args }),
    lineTo: (...args: any[]) => calls.push({ type: 'lineTo', args }),
    beginPath: () => {},
    // stroke 时记录当前的线宽和颜色，便于验证 repetitions
    stroke: () => calls.push({ type: 'stroke', args: [], lineWidth: ctx2d.lineWidth, strokeStyle: ctx2d.strokeStyle }),
  }
  const ctx = new CvsContext(new CvsBlock(scale, x, y, ctx2d))
  return { ctx, calls }
}

/** 提取一次绘制中的两条臂的端点对（顺序为 moveTo/lineTo 记录） */
function extractArms(calls: MockCall[]): [Coord, Coord][] {
  const arms: [Coord, Coord][] = []
  for (let i = 0; i < calls.length; i++) {
    if (calls[i].type === 'moveTo' && calls[i + 1]?.type === 'lineTo') {
      arms.push([calls[i].args as Coord, calls[i + 1].args as Coord])
      i++
    }
  }
  return arms
}

function expectArm(arm: [Coord, Coord], from: Coord, to: Coord) {
  expect(arm[0][0]).toBeCloseTo(from[0])
  expect(arm[0][1]).toBeCloseTo(from[1])
  expect(arm[1][0]).toBeCloseTo(to[0])
  expect(arm[1][1]).toBeCloseTo(to[1])
}

const singleRep = [{ armWidth: 2, color: '#000' }]

describe('drawCross - 兼容旧 dir 行为', () => {
  it('vertical：沿坐标轴的 + 形，臂端点偏移恰为 armLength', () => {
    const { ctx, calls } = createMockCtx()
    drawCross(ctx, { pos: [10, 20], dir: 'vertical', armLength: 5, repetitions: singleRep })

    const arms = extractArms(calls)
    expect(arms).toHaveLength(2)
    expectArm(arms[0], [5, 20], [15, 20])
    expectArm(arms[1], [10, 15], [10, 25])
  })

  it('incline：× 形，臂实际长度与 vertical 相同（端点轴向偏移为 armLength*√2/2）', () => {
    const { ctx, calls } = createMockCtx()
    const s = 5 * Math.SQRT2 / 2
    drawCross(ctx, { pos: [10, 20], dir: 'incline', armLength: 5, repetitions: singleRep })

    const arms = extractArms(calls)
    expect(arms).toHaveLength(2)
    expectArm(arms[0], [10 - s, 20 - s], [10 + s, 20 + s])
    expectArm(arms[1], [10 + s, 20 - s], [10 - s, 20 + s])
    //臂长（端点间距离）与 vertical 一致，为 armLength*2
    const len = Math.hypot(arms[0][1][0] - arms[0][0][0], arms[0][1][1] - arms[0][0][1])
    expect(len).toBeCloseTo(10)
  })
})

describe('drawCross - 任意角度 angleDeg', () => {
  it('angleDeg=0 与 vertical 等价', () => {
    const { ctx, calls } = createMockCtx()
    drawCross(ctx, { pos: [10, 20], angleDeg: 0, armLength: 5, repetitions: singleRep })

    const arms = extractArms(calls)
    expect(arms).toHaveLength(2)
    expectArm(arms[0], [5, 20], [15, 20])
    expectArm(arms[1], [10, 15], [10, 25])
  })

  it('angleDeg=30：臂 A 方向为 (cos30°, sin30°)，臂 B 与之垂直', () => {
    const { ctx, calls } = createMockCtx()
    const cos = Math.sqrt(3) / 2
    const sin = 1 / 2
    drawCross(ctx, { pos: [0, 0], angleDeg: 30, armLength: 10, repetitions: singleRep })

    const arms = extractArms(calls)
    expect(arms).toHaveLength(2)
    expectArm(arms[0], [-10 * cos, -10 * sin], [10 * cos, 10 * sin])
    expectArm(arms[1], [10 * sin, -10 * cos], [-10 * sin, 10 * cos])
  })

  it('angleDeg=60：臂 A 方向为 (cos60°, sin60°)，臂 B 与之垂直', () => {
    const { ctx, calls } = createMockCtx()
    const cos = 1 / 2
    const sin = Math.sqrt(3) / 2
    drawCross(ctx, { pos: [0, 0], angleDeg: 60, armLength: 10, repetitions: singleRep })

    const arms = extractArms(calls)
    expect(arms).toHaveLength(2)
    expectArm(arms[0], [-10 * cos, -10 * sin], [10 * cos, 10 * sin])
    expectArm(arms[1], [10 * sin, -10 * cos], [-10 * sin, 10 * cos])
  })

  it('angleDeg=90 与 angleDeg=0 画出同一个十字（两臂互换）', () => {
    const a = createMockCtx()
    drawCross(a.ctx, { pos: [3, 4], angleDeg: 0, armLength: 5, repetitions: singleRep })
    const b = createMockCtx()
    drawCross(b.ctx, { pos: [3, 4], angleDeg: 90, armLength: 5, repetitions: singleRep })

    const armsA = extractArms(a.calls)
    const armsB = extractArms(b.calls)
    //同一条线段允许端点顺序相反
    const sameSeg = (s1: [Coord, Coord], s2: [Coord, Coord]) => {
      const flat = (s: [Coord, Coord]) => [...s[0], ...s[1]].map(v => v.toFixed(6)).join(',')
      return flat(s1) === flat(s2) || flat(s1) === flat([s2[1], s2[0]])
    }
    expect(sameSeg(armsB[0], armsA[1])).toBe(true)
    expect(sameSeg(armsB[1], armsA[0])).toBe(true)
  })

  it('angleDeg 存在时优先于 dir', () => {
    const { ctx, calls } = createMockCtx()
    drawCross(ctx, { pos: [10, 20], dir: 'incline', angleDeg: 0, armLength: 5, repetitions: singleRep })

    const arms = extractArms(calls)
    expectArm(arms[0], [5, 20], [15, 20])
    expectArm(arms[1], [10, 15], [10, 25])
  })

  it('任意角度下臂长恰为 armLength，且中心为 pos', () => {
    const { ctx, calls } = createMockCtx()
    drawCross(ctx, { pos: [7, -3], angleDeg: 37, armLength: 6, repetitions: singleRep })

    const arms = extractArms(calls)
    for (const [from, to] of arms) {
      const len = Math.hypot(to[0] - from[0], to[1] - from[1])
      expect(len).toBeCloseTo(12)
      expect((from[0] + to[0]) / 2).toBeCloseTo(7)
      expect((from[1] + to[1]) / 2).toBeCloseTo(-3)
    }
  })
})

describe('drawCross - 空心与绘制长度', () => {
  it('hollowGap>0 时画四笔，四条臂仅绘制外侧部分', () => {
    const { ctx, calls } = createMockCtx()
    drawCross(ctx, { pos: [10, 20], angleDeg: 0, armLength: 10, hollowGap: 4, repetitions: singleRep })

    const arms = extractArms(calls)
    expect(arms).toHaveLength(4)
    //臂 A 两侧：从 4 画到 10
    expectArm(arms[0], [14, 20], [20, 20])
    expectArm(arms[1], [6, 20], [0, 20])
    //臂 B 两侧
    expectArm(arms[2], [10, 24], [10, 30])
    expectArm(arms[3], [10, 16], [10, 10])
  })

  it('drawLength 控制绘制部分长度：从 hollowGap 画到 hollowGap+drawLength', () => {
    const { ctx, calls } = createMockCtx()
    drawCross(ctx, { pos: [0, 0], angleDeg: 0, armLength: 10, hollowGap: 4, drawLength: 3, repetitions: singleRep })

    const arms = extractArms(calls)
    expect(arms).toHaveLength(4)
    expectArm(arms[0], [4, 0], [7, 0])
    expectArm(arms[1], [-4, 0], [-7, 0])
    expectArm(arms[2], [0, 4], [0, 7])
    expectArm(arms[3], [0, -4], [0, -7])
  })

  it('drawLength 单独使用（无 hollowGap）：仍为两笔，端点距离中心为 drawLength', () => {
    const { ctx, calls } = createMockCtx()
    drawCross(ctx, { pos: [10, 20], angleDeg: 0, armLength: 10, drawLength: 6, repetitions: singleRep })

    const arms = extractArms(calls)
    expect(arms).toHaveLength(2)
    expectArm(arms[0], [4, 20], [16, 20])
    expectArm(arms[1], [10, 14], [10, 26])
  })

  it('空心十字与 angleDeg 组合：臂方向正确且起止距离正确', () => {
    const { ctx, calls } = createMockCtx()
    const cos = Math.sqrt(3) / 2
    const sin = 1 / 2
    drawCross(ctx, { pos: [0, 0], angleDeg: 30, armLength: 10, hollowGap: 2, repetitions: singleRep })

    const arms = extractArms(calls)
    expect(arms).toHaveLength(4)
    //臂 A 正侧：从 2*(cos,sin) 画到 10*(cos,sin)
    expectArm(arms[0], [2 * cos, 2 * sin], [10 * cos, 10 * sin])
    //臂 A 负侧
    expectArm(arms[1], [-2 * cos, -2 * sin], [-10 * cos, -10 * sin])
  })

  it('空心模式下每个 repetition 仍只 stroke 一次（四笔在同一 beginPath 内）', () => {
    const { ctx, calls } = createMockCtx()
    drawCross(ctx, {
      pos: [0, 0], angleDeg: 0, armLength: 10, hollowGap: 4,
      repetitions: [
        { armWidth: 4, color: '#fff' },
        { armWidth: 2, color: '#000' },
      ]
    })

    const strokes = calls.filter(c => c.type === 'stroke')
    expect(strokes).toHaveLength(2)
    expect(strokes[0].lineWidth).toBe(4)
    expect(strokes[1].lineWidth).toBe(2)
  })
})

describe('drawCross - repetitions', () => {
  it('每个 repetition 独立 stroke 一次，线宽与颜色按序生效', () => {
    const { ctx, calls } = createMockCtx()
    drawCross(ctx, {
      pos: [0, 0], angleDeg: 30, armLength: 5,
      repetitions: [
        { armWidth: 4, color: '#fff' },
        { armWidth: 2, color: '#000' },
      ]
    })

    const strokes = calls.filter(c => c.type === 'stroke')
    expect(strokes).toHaveLength(2)
    expect(strokes[0].lineWidth).toBe(4)
    expect(strokes[0].strokeStyle).toBe('#fff')
    expect(strokes[1].lineWidth).toBe(2)
    expect(strokes[1].strokeStyle).toBe('#000')
  })
})
