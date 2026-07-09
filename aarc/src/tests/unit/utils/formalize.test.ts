import { describe, it, expect } from 'vitest'
import { formalize } from '@/utils/lineUtils/formalize'
import { ControlPoint, ControlPointDir } from '@/models/save'
import { Coord } from '@/models/coord'

// 测试用 ControlPoint，预留 isFree 字段以支持后续自由点测试
function pt(
  pos: Coord,
  dir: ControlPointDir = ControlPointDir.vertical,
  id = 0,
  isFree = false
): ControlPoint {
  return { id, pos, dir, sta: 0, isFree } as ControlPoint
}

function getAfterIdxEqv(res: ReturnType<typeof formalize>) {
  return res.map(x => x.afterIdxEqv)
}

function getPos(res: ReturnType<typeof formalize>) {
  return res.map(x => x.pos)
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

  // ==================== 回归不变量约束 ====================
  // 下面这些用例不依赖具体坐标，只约束 formalize 输出的整体结构。
  // 引入“自由点”等新功能时，必须继续满足这些不变量。

  it('非环线结果的首尾 formal 点必须等于首尾控制点', () => {
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 0], ControlPointDir.vertical, 2)
    const c = pt([30, 10], ControlPointDir.vertical, 3)
    const res = formalize([a, b, c])

    expect(getPos(res).at(0)).toEqual(a.pos)
    expect(getPos(res).at(-1)).toEqual(c.pos)
  })

  it('afterIdxEqv 必须从 idxOffset 单调递增到 pts.length-1+idxOffset', () => {
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 0], ControlPointDir.vertical, 2)
    const c = pt([30, 10], ControlPointDir.vertical, 3)
    const d = pt([40, 10], ControlPointDir.vertical, 4)
    const offset = 7
    const res = formalize([a, b, c, d], offset)
    const afters = getAfterIdxEqv(res)

    expect(afters.at(0)).toBe(offset)
    expect(afters.at(-1)).toBe(3 + offset)
    // 单调非降
    for (let i = 1; i < afters.length; i++) {
      expect(afters[i]).toBeGreaterThanOrEqual(afters[i - 1])
    }
    // 每个控制点索引至少出现一次
    for (let i = 0; i <= 3; i++) {
      expect(afters).toContain(i + offset)
    }
  })

  it('控制点自身必须出现在 formal 输出中且顺序正确', () => {
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([20, 10], ControlPointDir.incline, 2)
    const c = pt([40, 0], ControlPointDir.vertical, 3)
    const res = formalize([a, b, c])

    const controlPts = res.filter(
      (x, idx) => idx === 0 || x.afterIdxEqv !== res[idx - 1].afterIdxEqv
    )
    expect(controlPts.map(x => x.pos)).toEqual([a.pos, b.pos, c.pos])
  })

  // ==================== 自由点 TODO 测试（实现后取消 skip/todo） ====================
  // 这些用例描述自由点引入后的期望行为，作为实现约束。

  it.todo('中间单个自由点使其前后两个区间变为 direct seg（不插值）', () => {
    // A -> B(free) -> C
    // A->B 与 B->C 都应为 direct seg，结果只有 A, B, C 三个 formal 点
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 10], ControlPointDir.vertical, 2, true)
    const c = pt([20, 0], ControlPointDir.vertical, 3)
    const res = formalize([a, b, c])

    expect(getPos(res)).toEqual([a.pos, b.pos, c.pos])
    expect(getAfterIdxEqv(res)).toEqual([0, 1, 2])
  })

  it.todo('相邻两个自由点之间也是 direct seg', () => {
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 10], ControlPointDir.vertical, 2, true)
    const c = pt([20, 0], ControlPointDir.vertical, 3, true)
    const d = pt([30, 10], ControlPointDir.vertical, 4)
    const res = formalize([a, b, c, d])

    expect(getPos(res)).toEqual([a.pos, b.pos, c.pos, d.pos])
    expect(getAfterIdxEqv(res)).toEqual([0, 1, 2, 3])
  })

  it.todo('自由点相邻的病态段不会被矫正', () => {
    // A -> B(free) -> C，其中 A->B 是 vertical 对角线（×-×）
    // 由于 B 是自由点，A->B 是 direct seg，不应被 B->C 矫正
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 10], ControlPointDir.vertical, 2, true)
    const c = pt([20, 10], ControlPointDir.vertical, 3)
    const res = formalize([a, b, c])

    expect(getPos(res)).toEqual([a.pos, b.pos, c.pos])
  })

  it.todo('自由点不会作为健康段去矫正别人的病态段', () => {
    // A -> B(free) -> C -> D
    // A->B 与 B->C 都是 direct seg；C->D 是 vertical 对角线病态段
    // 只有 B->C 是 direct，不能作为 helper 去矫正 C->D
    const a = pt([0, 0], ControlPointDir.vertical, 1)
    const b = pt([10, 10], ControlPointDir.vertical, 2, true)
    const c = pt([20, 10], ControlPointDir.vertical, 3)
    const d = pt([30, 0], ControlPointDir.vertical, 4)
    const res = formalize([a, b, c, d])

    // C->D 的 formal 点只有 C 和 D，没有矫正 itp
    const cToDFormalPts = res.filter(x => x.afterIdxEqv === 2)
    expect(cToDFormalPts.length).toBe(1)
  })

  it.todo('自由点在线路首尾只影响相邻的一个区间', () => {
    const a = pt([0, 0], ControlPointDir.vertical, 1, true)
    const b = pt([10, 10], ControlPointDir.vertical, 2)
    const c = pt([20, 0], ControlPointDir.vertical, 3)
    const res = formalize([a, b, c])

    // A->B direct，B->C 正常 formalize
    expect(getAfterIdxEqv(res).at(0)).toBe(0)
    expect(getAfterIdxEqv(res).at(-1)).toBe(2)
  })
})
