import { describe, it, expect } from 'vitest'
import {
  buildNeighbors,
  cleanNeighborsForDeletedPt,
  expandSetInNeighbors,
  getMaxSizePtWithinClusterPure,
  getRectOfClusterPure,
  getStaClusterByIdPure,
  isPtSinglePure,
  makeClustersFromNeighborsPure,
  ptClingingPure,
  resolveStaNamePure,
  tryTransferStaNameWithinClusterPure,
  updateNeighborsForMovedPt
} from '@/models/stores/saveDerived/staClusterStore.pure'
import { ControlPoint, ControlPointLinkType, ControlPointSta } from '@/models/save'
import { numberCmpEpsilon } from '@/utils/consts'

function pt(id: number, pos: [number, number], sta: ControlPointSta = ControlPointSta.sta, overrides?: Partial<ControlPoint>): ControlPoint {
  return {
    id,
    pos,
    dir: 0,
    sta,
    ...overrides
  }
}

const snapSizeOne = () => 1

const configClingingDist = 25

describe('staClusterStore.pure - ptClingingPure', () => {
  it('距离小于阈值时应返回 true', () => {
    const a = pt(1, [0, 0])
    const b = pt(2, [10, 10])
    expect(ptClingingPure(a, b, configClingingDist, snapSizeOne, numberCmpEpsilon)).toBe(true)
  })

  it('距离大于阈值时应返回 false', () => {
    const a = pt(1, [0, 0])
    const b = pt(2, [100, 100])
    expect(ptClingingPure(a, b, configClingingDist, snapSizeOne, numberCmpEpsilon)).toBe(false)
  })

  it('阈值边界附近应正确判断', () => {
    const a = pt(1, [0, 0])
    // distSq = 24^2 = 576 < 25^2 = 625
    const b = pt(2, [24, 0])
    expect(ptClingingPure(a, b, configClingingDist, snapSizeOne, numberCmpEpsilon)).toBe(true)
    // distSq = 26^2 = 676 > 625
    const c = pt(3, [26, 0])
    expect(ptClingingPure(a, c, configClingingDist, snapSizeOne, numberCmpEpsilon)).toBe(false)
  })

  it('尺寸越大阈值应越大', () => {
    const a = pt(1, [0, 0])
    const b = pt(2, [40, 0])
    // 默认尺寸 1：clingingDist = 25，40 > 25，false
    expect(ptClingingPure(a, b, configClingingDist, snapSizeOne, numberCmpEpsilon)).toBe(false)
    // 尺寸 2：平均尺寸 2，clingingDist = 50，40 < 50，true
    expect(ptClingingPure(a, b, configClingingDist, () => 2, numberCmpEpsilon)).toBe(true)
  })
})

describe('staClusterStore.pure - buildNeighbors', () => {
  it('空列表应返回空邻接表', () => {
    expect(buildNeighbors([], configClingingDist, snapSizeOne, numberCmpEpsilon)).toEqual({})
  })

  it('两个接近的 sta 点应互相邻接', () => {
    const pts = [pt(1, [0, 0]), pt(2, [10, 10])]
    const neighbors = buildNeighbors(pts, configClingingDist, snapSizeOne, numberCmpEpsilon)
    expect(neighbors[1]?.has(2)).toBe(true)
    expect(neighbors[2]?.has(1)).toBe(true)
  })

  it('两个远离的 sta 点不应邻接', () => {
    const pts = [pt(1, [0, 0]), pt(2, [100, 100])]
    const neighbors = buildNeighbors(pts, configClingingDist, snapSizeOne, numberCmpEpsilon)
    expect(neighbors[1]).toBeUndefined()
    expect(neighbors[2]).toBeUndefined()
  })

  it('plain 点不应参与邻接', () => {
    const pts = [pt(1, [0, 0], ControlPointSta.plain), pt(2, [1, 1], ControlPointSta.plain)]
    const neighbors = buildNeighbors(pts, configClingingDist, snapSizeOne, numberCmpEpsilon)
    expect(Object.keys(neighbors)).toHaveLength(0)
  })

  it('X 方向超出跳过阈值时不应建立邻接', () => {
    // 2.5 * 25 = 62.5，X 差 70 应直接跳过
    const pts = [pt(1, [0, 0]), pt(2, [70, 0])]
    const neighbors = buildNeighbors(pts, configClingingDist, snapSizeOne, numberCmpEpsilon)
    expect(neighbors[1]).toBeUndefined()
  })

  it('三个点形成链式邻接', () => {
    const pts = [pt(1, [0, 0]), pt(2, [10, 0]), pt(3, [20, 0])]
    const neighbors = buildNeighbors(pts, configClingingDist, snapSizeOne, numberCmpEpsilon)
    expect(neighbors[1]?.has(2)).toBe(true)
    expect(neighbors[2]?.has(1)).toBe(true)
    expect(neighbors[2]?.has(3)).toBe(true)
    expect(neighbors[3]?.has(2)).toBe(true)
  })

  it('两对独立接近的点应形成两个独立邻接关系', () => {
    const pts = [pt(1, [0, 0]), pt(2, [1, 0]), pt(3, [100, 0]), pt(4, [101, 0])]
    const neighbors = buildNeighbors(pts, configClingingDist, snapSizeOne, numberCmpEpsilon)
    expect(neighbors[1]?.has(2)).toBe(true)
    expect(neighbors[3]?.has(4)).toBe(true)
    expect(neighbors[1]?.has(3)).toBe(false)
    expect(neighbors[2]?.has(4)).toBe(false)
  })
})

describe('staClusterStore.pure - makeClustersFromNeighborsPure', () => {
  it('空邻接表应返回空 clusters', () => {
    const dict: Record<number, ControlPoint> = {}
    expect(makeClustersFromNeighborsPure({}, id => dict[id])).toEqual([])
  })

  it('两个互相邻接的点应形成一个 cluster', () => {
    const a = pt(1, [0, 0])
    const b = pt(2, [1, 0])
    const neighbors = { 1: new Set([2]), 2: new Set([1]) }
    const clusters = makeClustersFromNeighborsPure(neighbors, id => [a, b].find(p => p.id === id))
    expect(clusters).toHaveLength(1)
    expect(clusters[0].map(p => p.id).sort()).toEqual([1, 2])
  })

  it('链式邻接应扩展成一个 cluster', () => {
    const pts = [pt(1, [0, 0]), pt(2, [1, 0]), pt(3, [2, 0])]
    const neighbors = { 1: new Set([2]), 2: new Set([1, 3]), 3: new Set([2]) }
    const clusters = makeClustersFromNeighborsPure(neighbors, id => pts.find(p => p.id === id))
    expect(clusters).toHaveLength(1)
    expect(clusters[0].map(p => p.id).sort()).toEqual([1, 2, 3])
  })

  it('两个独立 cluster 应分别返回', () => {
    const pts = [pt(1, [0, 0]), pt(2, [1, 0]), pt(3, [100, 0]), pt(4, [101, 0])]
    const neighbors = {
      1: new Set([2]),
      2: new Set([1]),
      3: new Set([4]),
      4: new Set([3])
    }
    const clusters = makeClustersFromNeighborsPure(neighbors, id => pts.find(p => p.id === id))
    expect(clusters).toHaveLength(2)
    const ids = clusters.map(c => c.map(p => p.id).sort())
    expect(ids).toContainEqual([1, 2])
    expect(ids).toContainEqual([3, 4])
  })

  it('getPtById 返回 undefined 的点应被忽略', () => {
    const a = pt(1, [0, 0])
    const neighbors = { 1: new Set([2, 3]), 2: new Set([1, 3]), 3: new Set([1, 2]) }
    const clusters = makeClustersFromNeighborsPure(neighbors, id => id === 1 ? a : undefined)
    expect(clusters).toHaveLength(1)
    expect(clusters[0]).toEqual([a])
  })
})

describe('staClusterStore.pure - updateNeighborsForMovedPt', () => {
  it('移动点脱离原 cluster 后应移除旧邻接', () => {
    const a = pt(1, [0, 0])
    const b = pt(2, [1, 0])
    const neighbors = buildNeighbors([a, b], configClingingDist, snapSizeOne, numberCmpEpsilon)
    const movedA = pt(1, [100, 100])
    const next = updateNeighborsForMovedPt(neighbors, movedA, [movedA, b], configClingingDist, snapSizeOne, numberCmpEpsilon)
    expect(next[1]?.has(2)).toBe(false)
    expect(next[2]?.has(1)).toBe(false)
  })

  it('移动点靠近新点后应建立新邻接', () => {
    const a = pt(1, [0, 0])
    const b = pt(2, [100, 0])
    const c = pt(3, [200, 0])
    const neighbors = buildNeighbors([a, b, c], configClingingDist, snapSizeOne, numberCmpEpsilon)
    const movedB = pt(2, [1, 0])
    const next = updateNeighborsForMovedPt(neighbors, movedB, [a, movedB, c], configClingingDist, snapSizeOne, numberCmpEpsilon)
    expect(next[2]?.has(1)).toBe(true)
    expect(next[1]?.has(2)).toBe(true)
  })

  it('点状态变为 plain 后应清除其邻接', () => {
    const a = pt(1, [0, 0])
    const b = pt(2, [1, 0])
    const neighbors = buildNeighbors([a, b], configClingingDist, snapSizeOne, numberCmpEpsilon)
    const plainA = pt(1, [0, 0], ControlPointSta.plain)
    const next = updateNeighborsForMovedPt(neighbors, plainA, [plainA, b], configClingingDist, snapSizeOne, numberCmpEpsilon)
    expect(next[1]?.size).toBe(0)
    expect(next[2]?.has(1)).toBe(false)
  })

  it('不应与自己建立邻接', () => {
    const a = pt(1, [0, 0])
    const next = updateNeighborsForMovedPt({}, a, [a], configClingingDist, snapSizeOne, numberCmpEpsilon)
    expect(next[1]?.has(1)).toBe(false)
  })
})

describe('staClusterStore.pure - cleanNeighborsForDeletedPt', () => {
  it('删除点应从邻居的邻接表中移除', () => {
    const a = pt(1, [0, 0])
    const b = pt(2, [1, 0])
    const c = pt(3, [2, 0])
    const neighbors = buildNeighbors([a, b, c], configClingingDist, snapSizeOne, numberCmpEpsilon)
    const next = cleanNeighborsForDeletedPt(neighbors, 2)
    expect(next[2]).toBeUndefined()
    expect(next[1]?.has(2)).toBe(false)
    expect(next[3]?.has(2)).toBe(false)
    expect(next[1]?.has(3)).toBe(true)
  })

  it('删除孤立点应无影响', () => {
    const next = cleanNeighborsForDeletedPt({ 1: new Set() }, 1)
    expect(next[1]).toBeUndefined()
  })
})

describe('staClusterStore.pure - tryTransferStaNameWithinClusterPure', () => {
  it('无 nameP 时不应转移', () => {
    const sta = pt(1, [0, 0], ControlPointSta.sta, { name: 'A', nameS: 'a' })
    const cluster = [sta, pt(2, [10, 0])]
    expect(tryTransferStaNameWithinClusterPure(sta, cluster)).toBeUndefined()
  })

  it('同 cluster 中存在更近点时返回转移描述', () => {
    const sta = pt(1, [0, 0], ControlPointSta.sta, { name: 'A', nameS: 'a', nameP: [15, 0] })
    // nameGlobalPos = [15, 0]
    // originalDistSq = 225
    const closer = pt(2, [14, 0])
    // distSq = 1，远小于 225，差值 > 200
    const cluster = [sta, closer]
    const transfer = tryTransferStaNameWithinClusterPure(sta, cluster)
    expect(transfer).toBeDefined()
    expect(transfer?.fromId).toBe(1)
    expect(transfer?.toId).toBe(2)
    expect(transfer?.name).toBe('A')
    expect(transfer?.nameP).toEqual([1, 0])
  })

  it('距离差异不足时不应转移', () => {
    const sta = pt(1, [0, 0], ControlPointSta.sta, { name: 'A', nameP: [5, 0] })
    const other = pt(2, [4, 0])
    // originalDistSq = 25, otherDistSq = 1, diff = 24 < 200
    const cluster = [sta, other]
    expect(tryTransferStaNameWithinClusterPure(sta, cluster)).toBeUndefined()
  })

  it('单点 cluster 不应转移', () => {
    const sta = pt(1, [0, 0], ControlPointSta.sta, { name: 'A', nameP: [100, 0] })
    expect(tryTransferStaNameWithinClusterPure(sta, [sta])).toBeUndefined()
  })
})

describe('staClusterStore.pure - getMaxSizePtWithinClusterPure', () => {
  it('未聚类点返回自身尺寸', () => {
    expect(getMaxSizePtWithinClusterPure(1, [], () => 3)).toBe(3)
  })

  it('聚类点返回 cluster 中最大尺寸', () => {
    const cluster = [pt(1, [0, 0]), pt(2, [1, 0]), pt(3, [2, 0])]
    const getSize = (id: number) => id
    expect(getMaxSizePtWithinClusterPure(1, [cluster], getSize)).toBe(3)
  })
})

describe('staClusterStore.pure - getRectOfClusterPure', () => {
  it('返回 cluster 的四角点', () => {
    const cluster = [
      pt(1, [0, 0]),
      pt(2, [10, 5]),
      pt(3, [3, 8])
    ]
    const rect = getRectOfClusterPure(cluster)
    expect(rect).toContainEqual([10, 8])
    expect(rect).toContainEqual([10, 0])
    expect(rect).toContainEqual([0, 8])
    expect(rect).toContainEqual([0, 0])
  })
})

describe('staClusterStore.pure - getStaClusterByIdPure', () => {
  it('返回点所在的 cluster', () => {
    const cluster = [pt(1, [0, 0]), pt(2, [1, 0])]
    expect(getStaClusterByIdPure(1, [cluster], () => undefined)).toEqual(cluster)
  })

  it('未聚类点返回自身组成的单点 cluster', () => {
    const a = pt(1, [0, 0])
    expect(getStaClusterByIdPure(1, [], id => id === 1 ? a : undefined)).toEqual([a])
  })

  it('点不存在时返回空数组', () => {
    expect(getStaClusterByIdPure(1, [], () => undefined)).toEqual([])
  })
})

describe('staClusterStore.pure - isPtSinglePure', () => {
  it('未聚类点应视为单点', () => {
    expect(isPtSinglePure(1, [])).toBe(true)
  })

  it('cluster 长度小于等于 1 时应视为单点', () => {
    expect(isPtSinglePure(1, [[pt(1, [0, 0])]])).toBe(true)
  })

  it('cluster 长度大于 1 时不视为单点', () => {
    expect(isPtSinglePure(1, [[pt(1, [0, 0]), pt(2, [1, 0])]])).toBe(false)
  })
})

describe('staClusterStore.pure - resolveStaNamePure', () => {
  it('自身有名称时返回自身', () => {
    const pts = [pt(1, [0, 0], ControlPointSta.sta, { name: 'A', nameS: 'a' })]
    const result = resolveStaNamePure(1, false, pts, [], [])
    expect(result).toEqual({ name: 'A', nameSub: 'a', ptId: 1 })
  })

  it('自身无名称时从同 cluster 获取', () => {
    const a = pt(1, [0, 0])
    const b = pt(2, [1, 0], ControlPointSta.sta, { name: 'B', nameS: 'b' })
    const result = resolveStaNamePure(1, false, [a, b], [], [[a, b]])
    expect(result).toEqual({ name: 'B', nameSub: 'b', ptId: 2 })
  })

  it('通过 pointLink 跨 cluster 获取名称', () => {
    const a = pt(1, [0, 0])
    const b = pt(2, [1, 0])
    const c = pt(3, [100, 0], ControlPointSta.sta, { name: 'C', nameS: 'c' })
    const links = [{ pts: [2, 3] as [number, number], type: ControlPointLinkType.cluster }]
    const result = resolveStaNamePure(1, false, [a, b, c], links, [[a, b], [c]])
    expect(result).toEqual({ name: 'C', nameSub: 'c', ptId: 3 })
  })

  it('raw=true 时保留换行符', () => {
    const pts = [pt(1, [0, 0], ControlPointSta.sta, { name: 'A\nB', nameS: 'a\nb' })]
    const result = resolveStaNamePure(1, true, pts, [], [])
    expect(result).toEqual({ name: 'A\nB', nameSub: 'a\nb', ptId: 1 })
  })

  it('默认移除换行符', () => {
    const pts = [pt(1, [0, 0], ControlPointSta.sta, { name: 'A\nB', nameS: 'a\nb' })]
    const result = resolveStaNamePure(1, false, pts, [], [])
    expect(result).toEqual({ name: 'AB', nameSub: 'ab', ptId: 1 })
  })

  it('无名称可获取时返回 #ptId', () => {
    const a = pt(1, [0, 0])
    const result = resolveStaNamePure(1, false, [a], [], [])
    expect(result).toEqual({ name: '#1', nameSub: '', ptId: 1 })
  })
})

describe('staClusterStore.pure - expandSetInNeighbors', () => {
  it('应递归扩展邻接集合', () => {
    const neighbors = {
      1: new Set([2]),
      2: new Set([1, 3]),
      3: new Set([2])
    }
    const set = new Set<number>()
    expandSetInNeighbors(neighbors, set, 1)
    expect(set).toEqual(new Set([1, 2, 3]))
  })
})
