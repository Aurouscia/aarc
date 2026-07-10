import { describe, it, expect } from 'vitest'
import { CvsBlock, CvsContext } from '@/models/cvs/common/cvsContext'
import { linkPts } from '@/models/cvs/workers/lineCvsWorker'
import { FormalPt } from '@/models/coord'
import { Line } from '@/models/save'
import { WayRel } from '@/utils/rayUtils/rayParallel'

type MockCall = { type: string; args: number[] }

function createMockCtx(scale = 1, x = 0, y = 0) {
  const calls: MockCall[] = []
  const ctx2d = {
    arc: (...args: any[]) => calls.push({ type: 'arc', args }),
    lineTo: (...args: any[]) => calls.push({ type: 'lineTo', args }),
    moveTo: (...args: any[]) => calls.push({ type: 'moveTo', args }),
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

function fpts(positions: [number, number][]): FormalPt[] {
  return positions.map((pos, idx) => ({ pos, afterIdxEqv: idx }))
}

function fixedRadius(radius: number) {
  return (_line: Line, _rel: WayRel) => radius
}

function dummyLine(): Line {
  return {
    id: 1,
    pts: [],
    name: '',
    nameSub: '',
    color: '',
    type: 0,
    width: 1,
  }
}

describe('linkPts', () => {
  it('非环线两个点：只有 moveTo 和 lineTo', () => {
    const { ctx, calls } = createMockCtx()
    linkPts(ctx, fpts([[0, 0], [10, 0]]), dummyLine(), fixedRadius(2))

    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual({ type: 'moveTo', args: [0, 0] })
    expect(calls[1]).toEqual({ type: 'lineTo', args: [10, 0] })
  })

  it('非环线 90° 拐角：moveTo -> lineTo -> arc -> lineTo', () => {
    const { ctx, calls } = createMockCtx()
    linkPts(ctx, fpts([[0, 0], [10, 0], [10, 10]]), dummyLine(), fixedRadius(2))

    expect(calls).toHaveLength(4)
    expect(calls[0]).toEqual({ type: 'moveTo', args: [0, 0] })
    expect(calls[1]).toEqual({ type: 'lineTo', args: [8, 0] })
    expect(calls[2].type).toBe('arc')
    expect(calls[3]).toEqual({ type: 'lineTo', args: [10, 10] })

    // 验证圆弧几何：从 (8,0) 到 (10,2) 经过 (10,0)，圆心应为 (8,2)，半径 2
    const [cx, cy, r, startAngle, endAngle, counterClockwise] = calls[2].args
    expect(cx).toBeCloseTo(8)
    expect(cy).toBeCloseTo(2)
    expect(r).toBeCloseTo(2)
    expect(startAngle).toBeCloseTo(-Math.PI / 2)
    expect(endAngle).toBeCloseTo(0)
    expect(counterClockwise).toBe(false)
  })

  it('非环线圆角半径受线段长度限制', () => {
    const { ctx, calls } = createMockCtx()
    // 两段都很短，只有 3 个单位；即使回调返回 100，实际半径也不超过 1.5
    linkPts(ctx, fpts([[0, 0], [3, 0], [3, 3]]), dummyLine(), fixedRadius(100))

    const arc = calls.find(c => c.type === 'arc')
    expect(arc).toBeDefined()
    expect(arc!.args[2]).toBeCloseTo(1.5)
  })

  it('环线方形：首尾从头部切点闭合', () => {
    const { ctx, calls } = createMockCtx()
    const ring = fpts([[0, 0], [10, 0], [10, 10], [0, 0]])
    linkPts(ctx, ring, dummyLine(), fixedRadius(2))

    // 环线有 3 个有效转角，每个转角产生一个 arc
    const arcs = calls.filter(c => c.type === 'arc')
    expect(arcs).toHaveLength(3)

    // 起点必须是 moveTo（从头部切点开始）
    expect(calls[0].type).toBe('moveTo')

    // 最后一条操作必须是 lineTo，用于闭合回头部切点
    expect(calls[calls.length - 1].type).toBe('lineTo')

    // 头部 moveTo 的坐标应等于最后的 lineTo 坐标
    expect(calls[0].args).toEqual(calls[calls.length - 1].args)
  })

  it('平行转角退化为直线：不产生 arc', () => {
    const { ctx, calls } = createMockCtx()
    linkPts(ctx, fpts([[0, 0], [10, 0], [20, 0]]), dummyLine(), fixedRadius(2))

    expect(calls.some(c => c.type === 'arc')).toBe(false)
    expect(calls[0]).toEqual({ type: 'moveTo', args: [0, 0] })
    expect(calls[calls.length - 1]).toEqual({ type: 'lineTo', args: [20, 0] })
  })
})
