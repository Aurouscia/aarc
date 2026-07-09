import { describe, it, expect } from 'vitest'
import { formalize } from '@/utils/lineUtils/formalize'
import { ControlPoint, ControlPointDir } from '@/models/save'
import { Coord } from '@/models/coord'

function pt(pos: Coord, dir: ControlPointDir = ControlPointDir.vertical, id = 0): ControlPoint {
  return { id, pos, dir, sta: 0 }
}

describe('formalize', () => {
  it('少于 2 个控制点时应返回空数组', () => {
    expect(formalize([])).toEqual([])
    expect(formalize([pt([0, 0])])).toEqual([])
  })

  it('同向 vertical 水平段不插入中间点', () => {
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 0], ControlPointDir.vertical, 2)
    const res = formalize([a, b])

    expect(res.map(x => x.pos)).toEqual([[0, 0], [10, 0]])
    expect(res.map(x => x.afterIdxEqv)).toEqual([0, 1])
  })

  it('同向 vertical 对角线段为病态段（×-×），不插入中间点', () => {
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 10], ControlPointDir.vertical, 2)
    const res = formalize([a, b])

    expect(res.map(x => x.pos)).toEqual([[0, 0], [10, 10]])
    expect(res.map(x => x.afterIdxEqv)).toEqual([0, 1])
  })

  it('同向 vertical 浅斜段使用 midInc 插入两个中间点', () => {
    // a(0,0) -> b(20,10): posRel='llu', 垂直方向走“横-竖-横”折中
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([20, 10], ControlPointDir.vertical, 2)
    const res = formalize([a, b])

    expect(res.map(x => x.pos)).toEqual([
      [0, 0],
      [5, 0],
      [15, 10],
      [20, 10]
    ])
    expect(res.map(x => x.afterIdxEqv)).toEqual([0, 0, 0, 1])
  })

  it('同向 incline 浅斜段使用 midVert 插入两个中间点', () => {
    // a(0,0) -> b(20,10): posRel='llu', 斜向走“斜-平-斜”折中
    const a = pt([0, 0], ControlPointDir.incline, 1)
    const b = pt([20, 10], ControlPointDir.incline, 2)
    const res = formalize([a, b])

    expect(res.map(x => x.pos)).toEqual([
      [0, 0],
      [5, 5],
      [15, 5],
      [20, 10]
    ])
    expect(res.map(x => x.afterIdxEqv)).toEqual([0, 0, 0, 1])
  })

  it('vertical -> incline 不同方向浅斜段使用 top 插入一个中间点', () => {
    // a(0,0,vertical) -> b(20,10,incline): posRel='llu'
    // vertical 作为起点时取 top，生成水平拐点
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([20, 10], ControlPointDir.incline, 2)
    const res = formalize([a, b])

    expect(res.map(x => x.pos)).toEqual([
      [0, 0],
      [10, 0],
      [20, 10]
    ])
    expect(res.map(x => x.afterIdxEqv)).toEqual([0, 0, 1])
  })

  it('incline -> vertical 不同方向浅斜段使用 bottom 插入一个中间点', () => {
    // a(0,0,incline) -> b(20,10,vertical): posRel='llu'
    // vertical 作为终点时取 bottom，生成水平拐点
    const a = pt([0, 0], ControlPointDir.incline, 1)
    const b = pt([20, 10], ControlPointDir.vertical, 2)
    const res = formalize([a, b])

    expect(res.map(x => x.pos)).toEqual([
      [0, 0],
      [10, 10],
      [20, 10]
    ])
    expect(res.map(x => x.afterIdxEqv)).toEqual([0, 0, 1])
  })

  it('多段线路的 afterIdxEqv 按原控制点索引递进', () => {
    // A(0,0) -> B(10,0) -> C(30,10)
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 0], ControlPointDir.vertical, 2)
    const c = pt([30, 10], ControlPointDir.vertical, 3)
    const res = formalize([a, b, c])

    // A->B 无 itp；B->C 为 llu，有 2 个 itp
    expect(res.map(x => x.afterIdxEqv)).toEqual([0, 1, 1, 1, 2])
    expect(res[0].pos).toEqual([0, 0])
    expect(res[res.length - 1].pos).toEqual([30, 10])
  })

  it('idxOffset 会平移所有 afterIdxEqv', () => {
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 0], ControlPointDir.vertical, 2)
    const res = formalize([a, b], 5)

    expect(res.map(x => x.afterIdxEqv)).toEqual([5, 6])
  })

  it('正交环线各段无插值，首尾回到起点', () => {
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 0], ControlPointDir.vertical, 2)
    const c = pt([10, 10], ControlPointDir.vertical, 3)
    const d = pt([0, 10], ControlPointDir.vertical, 4)
    const e = pt([0, 0], ControlPointDir.vertical, 1) // 与 a 同 id
    const res = formalize([a, b, c, d, e])

    expect(res.map(x => x.pos)).toEqual([
      [0, 0], [10, 0], [10, 10], [0, 10], [0, 0]
    ])
    expect(res.map(x => x.afterIdxEqv)).toEqual([0, 1, 2, 3, 4])
  })

  it('环线闭合段为病态段时，会利用 margin 段进行矫正', () => {
    // A(0,0) -> B(10,0) -> C(10,10) -> A(0,0)
    // C->A 是 vertical 方向的对角线，属于病态段；
    // 环线通过添加头尾 margin 段，让病态闭合段能被前后正交段矫正出拐点 (10,0)
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 0], ControlPointDir.vertical, 2)
    const c = pt([10, 10], ControlPointDir.vertical, 3)
    const d = pt([0, 0], ControlPointDir.vertical, 1) // 与 a 同 id
    const res = formalize([a, b, c, d])

    expect(res[0].pos).toEqual([0, 0])
    expect(res[res.length - 1].pos).toEqual([0, 0])
    expect(res.map(x => x.pos)).toEqual([
      [0, 0], [10, 0], [10, 10], [10, 0], [0, 0]
    ])
    expect(res.map(x => x.afterIdxEqv)).toEqual([0, 1, 2, 2, 3])
  })

  it('末端病态段会被邻近健康段矫正', () => {
    // A(0,0,vertical) -> B(10,10,vertical): 对角线，vertical 方向，病态
    // B(10,10,vertical) -> C(20,10,vertical): 水平，健康
    // 第一段会被第二段反向延长线矫正，从 A 向 BC 延长线作垂线得到 (0,10)
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 10], ControlPointDir.vertical, 2)
    const c = pt([20, 10], ControlPointDir.vertical, 3)
    const res = formalize([a, b, c])

    expect(res.map(x => x.pos)).toEqual([
      [0, 0],
      [0, 10],
      [10, 10],
      [20, 10]
    ])
    expect(res.map(x => x.afterIdxEqv)).toEqual([0, 0, 1, 2])
  })

  it('中间病态段在两端都比它健康时会被矫正', () => {
    // A(0,0,v) -> B(10,0,v): 水平健康
    // B(10,0,v) -> C(20,10,v): 对角线，vertical 方向，病态 ill=2
    // C(20,10,v) -> D(20,20,v): 垂直健康
    // 中间段 B->C 的 ill 大于两端，且前后延长线相交，会被矫正出一个 itp
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 0], ControlPointDir.vertical, 2)
    const c = pt([20, 10], ControlPointDir.vertical, 3)
    const d = pt([20, 20], ControlPointDir.vertical, 4)
    const res = formalize([a, b, c, d])

    const bToCFormalPts = res.filter(x => x.afterIdxEqv === 1)
    // B 自身 + 至少 1 个矫正产生的 itp
    expect(bToCFormalPts.length).toBeGreaterThanOrEqual(2)
  })
})
