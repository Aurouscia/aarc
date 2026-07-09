import { describe, it, expect } from 'vitest'
import { CvsBlock, CvsContext } from '@/models/cvs/common/cvsContext'
import { drawArcByThreePoints, drawArcByTwoRays } from '@/utils/drawUtils/drawArc'
import { FormalRay } from '@/models/coord'
import { coordDist } from '@/utils/coordUtils/coordDist'
import { coordDotProduct } from '@/utils/coordUtils/coordMath'

type MockCall = { type: string; args: any[] }

function createMockCtx(scale = 1, x = 0, y = 0) {
  const calls: MockCall[] = []
  const ctx2d = {
    arc: (...args: any[]) => calls.push({ type: 'arc', args }),
    lineTo: (...args: any[]) => calls.push({ type: 'lineTo', args }),
    // drawArc 目前只用到 arc/lineTo，其余方法提供空实现
    beginPath: () => {},
    closePath: () => {},
    stroke: () => {},
    fill: () => {},
    strokeRect: () => {},
    fillRect: () => {},
    strokeText: () => {},
    fillText: () => {},
    measureText: () => ({ width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 }),
    setLineDash: () => {},
    drawImage: () => {},
    createPattern: () => null,
  }
  const ctx = new CvsContext(new CvsBlock(scale, x, y, ctx2d as any))
  return { ctx, calls }
}

describe('drawArcByThreePoints', () => {
  it('90° 转角应画出 1/4 圆弧（中心、半径、起止角正确）', () => {
    const { ctx, calls } = createMockCtx()
    // 从 (-5,0) 到 (0,0) 再到 (0,5)，切距为 5 的 90° 拐角
    drawArcByThreePoints(ctx, [-5, 0], [0, 0], [0, 5])

    expect(calls).toHaveLength(1)
    expect(calls[0].type).toBe('arc')
    const [cx, cy, r, startAngle, endAngle, counterClockwise] = calls[0].args
    expect(cx).toBeCloseTo(-5)
    expect(cy).toBeCloseTo(5)
    expect(r).toBeCloseTo(5)
    expect(startAngle).toBeCloseTo(-Math.PI / 2)
    expect(endAngle).toBeCloseTo(0)
    expect(counterClockwise).toBe(false)
  })

  it('同向（平行）时退化画直线', () => {
    const { ctx, calls } = createMockCtx()
    drawArcByThreePoints(ctx, [-5, 0], [0, 0], [5, 0])

    expect(calls).toHaveLength(1)
    expect(calls[0].type).toBe('lineTo')
    expect(calls[0].args).toEqual([5, 0])
  })

  it('135° 转角的几何不变量：圆心到两端点距离相等且等于半径', () => {
    const { ctx, calls } = createMockCtx()
    // 构造 135° 拐角：入射方向 (1,0)，出射方向 (-1,1)/√2
    // 切距 d=5，切点 a 在入射侧，c 在出射侧
    const d = 5
    const a: [number, number] = [-d, 0]
    const b: [number, number] = [0, 0]
    const c: [number, number] = [-d / Math.SQRT2, d / Math.SQRT2]
    drawArcByThreePoints(ctx, a, b, c)

    expect(calls).toHaveLength(1)
    expect(calls[0].type).toBe('arc')
    const [cx, cy, r] = calls[0].args
    const center: [number, number] = [cx, cy]
    expect(coordDist(center, a)).toBeCloseTo(r)
    expect(coordDist(center, c)).toBeCloseTo(r)
  })

  it('45° 转角的几何不变量：圆心到两端点距离相等且等于半径', () => {
    const { ctx, calls } = createMockCtx()
    // 构造 45° 拐角：入射方向 (1,0)，出射方向 (1,1)/√2
    const d = 5
    const a: [number, number] = [-d, 0]
    const b: [number, number] = [0, 0]
    const c: [number, number] = [d / Math.SQRT2, d / Math.SQRT2]
    drawArcByThreePoints(ctx, a, b, c)

    expect(calls).toHaveLength(1)
    expect(calls[0].type).toBe('arc')
    const [cx, cy, r] = calls[0].args
    const center: [number, number] = [cx, cy]
    expect(coordDist(center, a)).toBeCloseTo(r)
    expect(coordDist(center, c)).toBeCloseTo(r)
  })

  it('圆心到弧两端点的连线分别垂直于入射/出射线', () => {
    const { ctx, calls } = createMockCtx()
    const a: [number, number] = [-5, 0]
    const b: [number, number] = [0, 0]
    const c: [number, number] = [0, 5]
    drawArcByThreePoints(ctx, a, b, c)

    const [cx, cy, r] = calls[0].args
    const center: [number, number] = [cx, cy]

    // 入射线方向 (1,0)，圆心到 a 的向量应与之垂直
    const toA: [number, number] = [a[0] - center[0], a[1] - center[1]]
    expect(coordDotProduct(toA, [1, 0])).toBeCloseTo(0)

    // 出射线方向 (0,1)，圆心到 c 的向量应与之垂直
    const toC: [number, number] = [c[0] - center[0], c[1] - center[1]]
    expect(coordDotProduct(toC, [0, 1])).toBeCloseTo(0)

    expect(coordDist(center, a)).toBeCloseTo(r)
    expect(coordDist(center, c)).toBeCloseTo(r)
  })
})

describe('drawArcByTwoRays', () => {
  it('显式传入 radius 时，应使用该半径而非几何计算半径', () => {
    const { ctx, calls } = createMockCtx()
    const rayA: FormalRay = { source: [-5, 0], way: [1, 0] }
    const rayB: FormalRay = { source: [0, 5], way: [0, 1] }
    drawArcByTwoRays(ctx, rayA, rayB, 3)

    expect(calls[0].type).toBe('arc')
    const [, , r] = calls[0].args
    expect(r).toBeCloseTo(3)
  })

  it('钝角（>90°）转角的几何不变量', () => {
    const { ctx, calls } = createMockCtx()
    // 入射方向 (1,0)，出射方向 (-1,1)/√2，夹角 135°
    const d = 5
    const rayA: FormalRay = { source: [-d, 0], way: [1, 0] }
    const rayB: FormalRay = { source: [-d / Math.SQRT2, d / Math.SQRT2], way: [-1, 1] }
    drawArcByTwoRays(ctx, rayA, rayB)

    expect(calls[0].type).toBe('arc')
    const [cx, cy, r] = calls[0].args
    const center: [number, number] = [cx, cy]
    expect(coordDist(center, rayA.source)).toBeCloseTo(r)
    expect(coordDist(center, rayB.source)).toBeCloseTo(r)
  })
})

// ==================== 任意角度 TODO 测试 ====================
// 自由点引入后，drawArc 需要支持非 45° 整数倍的转角。
// 这些用例约束未来新增的实际射线版本（如 drawArcByActualRays）的行为。

describe('drawArc 任意角度支持（todo）', () => {
  it.todo('120° 转角的圆心到两端点距离相等且等于半径', () => {
    // 可使用 drawArcByActualRays 或等价的未来 API 测试
  })

  it.todo('30° 转角的圆弧绘制方向（counterClockwise）正确', () => {})

  it.todo('任意角度下，圆心到弧端点的连线仍垂直于入射/出射线', () => {})
})
