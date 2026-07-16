import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPinia } from '../../helpers/piniaTestHelper'
import { useSaveStore } from '@/models/stores/saveStore'
import { useStaClusterStore } from '@/models/stores/saveDerived/staClusterStore'
import { ControlPointLinkType } from '@/models/save'
// 注意：虽然代码不再限制 link 类型，但测试中仍使用 ControlPointLinkType 来创建不同类型的 link
import {
  resetIdCounter,
  createPoint,
  createEmptySave
} from '../../helpers/saveFactory'

describe('staClusterStore - getStaName', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  it('点本身有名称时应返回该名称', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), name: '天安门东', nameS: 'Tiananmen East' }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(1)

    expect(result.name).toBe('天安门东')
    expect(result.nameSub).toBe('Tiananmen East')
    expect(result.ptId).toBe(1)
  })

  it('点本身无名称时应返回 #ptId 作为回退', () => {
    const save = createEmptySave({
      points: [createPoint(1)]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(1)

    expect(result.name).toBe('#1')
    expect(result.nameSub).toBe('')
    expect(result.ptId).toBe(1)
  })

  it('点本身无名称但同 cluster 中其他点有名称时应返回 cluster 中的名称', () => {
    // 两个点位置非常接近，会被聚类到同一个 cluster
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0.5], name: '西直门', nameS: 'Xizhimen' }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    // ptId=1 本身无名称，但和 ptId=2 在同一个 cluster
    const result = store.getStaName(1)

    expect(result.name).toBe('西直门')
    expect(result.nameSub).toBe('Xizhimen')
    expect(result.ptId).toBe(2)
  })

  it('名称中的换行符应被移除', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), name: '天安门\n东', nameS: 'Tiananmen\nEast' }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(1)

    expect(result.name).toBe('天安门东')
    expect(result.nameSub).toBe('TiananmenEast')
  })

  it('同 cluster 中其他点的名称换行符也应被移除', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0.5], name: '西直\n门', nameS: 'Xizhi\nmen' }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(1)

    expect(result.name).toBe('西直门')
    expect(result.nameSub).toBe('Xizhimen')
  })

  it('不存在的点应返回 #ptId', () => {
    const save = createEmptySave({
      points: []
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(999)

    expect(result.name).toBe('#999')
    expect(result.nameSub).toBe('')
    expect(result.ptId).toBe(999)
  })

  it('点本身有名称时优先使用自身名称，不查找 cluster', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0], name: '东直门', nameS: 'Dongzhimen' },
        { ...createPoint(2), pos: [0.5, 0.5], name: '西直门', nameS: 'Xizhimen' }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(1)

    expect(result.name).toBe('东直门')
    expect(result.nameSub).toBe('Dongzhimen')
    expect(result.ptId).toBe(1)
  })

  it('nameS 为 undefined 时应返回空字符串', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), name: '朝阳门', nameS: undefined }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const result = store.getStaName(1)

    expect(result.name).toBe('朝阳门')
    expect(result.nameSub).toBe('')
  })

  describe('通过 ptLink 跨 cluster 查找名称', () => {
    it('通过 cluster 类型的 ptLink 直接相连的 cluster 应能获取名称', () => {
      // cluster A: pt1(无名) + pt2(无名) —— 位置接近形成 cluster
      // cluster B: pt3(有名) —— 单独一个点
      // ptLink: pt2(cluster A) --cluster-- pt3(cluster B)
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5] },
          { ...createPoint(3), pos: [100, 100], name: '北京南站', nameS: 'Beijing South' }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1)

      expect(result.name).toBe('北京南站')
      expect(result.nameSub).toBe('Beijing South')
      expect(result.ptId).toBe(3)
    })

    it('间接相连（A-B-C）应能获取到 C 的名称', () => {
      // cluster A: pt1(无名) + pt2(无名)
      // cluster B: pt3(无名) + pt4(无名)
      // cluster C: pt5(有名)
      // ptLink: pt2(A) --cluster-- pt3(B), pt4(B) --cluster-- pt5(C)
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5] },
          { ...createPoint(3), pos: [100, 100] },
          { ...createPoint(4), pos: [100.5, 100.5] },
          { ...createPoint(5), pos: [200, 200], name: '西单', nameS: 'Xidan' }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.cluster },
          { pts: [4, 5], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      // 从 cluster A 的 pt1 查找，应通过 B 找到 C 的名称
      const result = store.getStaName(1)

      expect(result.name).toBe('西单')
      expect(result.nameSub).toBe('Xidan')
      expect(result.ptId).toBe(5)
    })

    it('优先返回本 cluster 中的名称，而非跨 cluster 查找', () => {
      // cluster A: pt1(无名) + pt2(有名)
      // cluster B: pt3(有名)
      // ptLink: pt2(A) --cluster-- pt3(B)
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5], name: '东直门', nameS: 'Dongzhimen' },
          { ...createPoint(3), pos: [100, 100], name: '西直门', nameS: 'Xizhimen' }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1)

      // 应优先返回同 cluster 的东直门，而不是跨 cluster 的西直门
      expect(result.name).toBe('东直门')
      expect(result.nameSub).toBe('Dongzhimen')
      expect(result.ptId).toBe(2)
    })

    it('任何类型的 ptLink 都应支持名称传导', () => {
      // cluster A: pt1(无名) + pt2(无名)
      // cluster B: pt3(有名)
      // ptLink: pt2(A) --fat-- pt3(B) （非 cluster 类型，但现在任何类型都支持）
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5] },
          { ...createPoint(3), pos: [100, 100], name: '天安门东', nameS: 'Tiananmen East' }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.fat }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1)

      // fat 类型的 link 现在也应支持跨 cluster 名称传导
      expect(result.name).toBe('天安门东')
      expect(result.nameSub).toBe('Tiananmen East')
      expect(result.ptId).toBe(3)
    })

    it('多个 cluster 通过 ptLink 形成网状结构时应正确找到最近的有名 cluster', () => {
      // cluster A: pt1(无名)
      // cluster B: pt2(有名) —— 距离 A 1 跳
      // cluster C: pt3(有名) —— 距离 A 2 跳
      // ptLink: pt1(A) --cluster-- pt2(B), pt1(A) --cluster-- pt3(C)
      // BFS 应先访问 B，返回 B 的名称
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [100, 0], name: '建国门', nameS: 'Jianguomen' },
          { ...createPoint(3), pos: [200, 0], name: '永安里', nameS: 'Yonganli' }
        ],
        pointLinks: [
          { pts: [1, 2], type: ControlPointLinkType.cluster },
          { pts: [1, 3], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1)

      // BFS 先访问直接相连的 cluster B
      expect(result.name).toBe('建国门')
      expect(result.ptId).toBe(2)
    })

    it('所有可达 cluster 都无名称时应返回 #ptId', () => {
      // cluster A: pt1(无名) + pt2(无名)
      // cluster B: pt3(无名) + pt4(无名)
      // ptLink: pt2(A) --cluster-- pt3(B)
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5] },
          { ...createPoint(3), pos: [100, 100] },
          { ...createPoint(4), pos: [100.5, 100.5] }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1)

      expect(result.name).toBe('#1')
      expect(result.nameSub).toBe('')
      expect(result.ptId).toBe(1)
    })

    it('跨 cluster 获取的名称换行符也应被移除', () => {
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5] },
          { ...createPoint(3), pos: [100, 100], name: '北京\n南站', nameS: 'Beijing\nSouth' }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1)

      expect(result.name).toBe('北京南站')
      expect(result.nameSub).toBe('BeijingSouth')
    })
  })

  describe('raw 参数', () => {
    it('raw=true 时应保留换行符', () => {
      const save = createEmptySave({
        points: [
          { ...createPoint(1), name: '北京\n南站', nameS: 'Beijing\nSouth' }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1, true)

      expect(result.name).toBe('北京\n南站')
      expect(result.nameSub).toBe('Beijing\nSouth')
    })

    it('raw=true 时跨 cluster 名称也应保留换行符', () => {
      const save = createEmptySave({
        points: [
          { ...createPoint(1), pos: [0, 0] },
          { ...createPoint(2), pos: [0.5, 0.5] },
          { ...createPoint(3), pos: [100, 100], name: '北京\n南站', nameS: 'Beijing\nSouth' }
        ],
        pointLinks: [
          { pts: [2, 3], type: ControlPointLinkType.cluster }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1, true)

      expect(result.name).toBe('北京\n南站')
      expect(result.nameSub).toBe('Beijing\nSouth')
    })

    it('raw=false 时应移除换行符（与默认行为一致）', () => {
      const save = createEmptySave({
        points: [
          { ...createPoint(1), name: '北京\n南站', nameS: 'Beijing\nSouth' }
        ]
      })
      setupSaveStore(save)
      const store = useStaClusterStore()

      const result = store.getStaName(1, false)

      expect(result.name).toBe('北京南站')
      expect(result.nameSub).toBe('BeijingSouth')
    })
  })
})

describe('staClusterStore - cluster/query', () => {
  beforeEach(() => {
    resetIdCounter()
    createTestPinia()
  })

  function setupSaveStore(save: ReturnType<typeof createEmptySave>) {
    const saveStore = useSaveStore()
    saveStore.save = save
    return saveStore
  }

  it('getStaClusters 应懒加载并正确聚类', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0.5] },
        { ...createPoint(3), pos: [100, 100] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const clusters = store.getStaClusters()

    expect(clusters).toHaveLength(1)
    expect(clusters?.[0].map(p => p.id).sort()).toEqual([1, 2])
  })

  it('getStaClusters 不包含孤立单点', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [100, 100] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const clusters = store.getStaClusters()

    expect(clusters).toHaveLength(0)
  })

  it('updateClustersBecauseOf 应在点移动后更新 cluster', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0.5] },
        { ...createPoint(3), pos: [100, 100] }
      ]
    })
    const saveStore = setupSaveStore(save)
    const store = useStaClusterStore()
    store.getStaClusters()

    const movedPt = saveStore.getPtById(3)!
    movedPt.pos = [0.6, 0.6]
    store.updateClustersBecauseOf(movedPt)

    const clusters = store.getStaClusters()
    expect(clusters).toHaveLength(1)
    expect(clusters?.[0].map(p => p.id).sort()).toEqual([1, 2, 3])
  })

  it('updateClustersBecauseOf 在点变为 plain 后应将其移出 cluster', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0.5] }
      ]
    })
    const saveStore = setupSaveStore(save)
    const store = useStaClusterStore()
    store.getStaClusters()

    const pt = saveStore.getPtById(2)!
    pt.sta = 0 // plain
    store.updateClustersBecauseOf(pt)

    const clusters = store.getStaClusters()
    expect(clusters).toHaveLength(0)
  })

  it('cleanClustersFromDeletedPt 应在删除点后更新 cluster', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0.5] },
        { ...createPoint(3), pos: [1, 1] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()
    store.getStaClusters()

    store.cleanClustersFromDeletedPt(2)

    const clusters = store.getStaClusters()
    // 删除 pt2 后，pt1 与 pt3 距离仍小于阈值，应保持在一个 cluster
    expect(clusters).toHaveLength(1)
    expect(clusters?.[0].map(p => p.id).sort()).toEqual([1, 3])
  })

  it('tryTransferStaNameWithinCluster 应把名称转移到更近点', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0], name: 'A', nameP: [15, 0] },
        { ...createPoint(2), pos: [14, 0] }
      ]
    })
    const saveStore = setupSaveStore(save)
    const store = useStaClusterStore()

    const sta = saveStore.getPtById(1)!
    const target = store.tryTransferStaNameWithinCluster(sta)

    expect(target).toBeDefined()
    expect(target?.id).toBe(2)
    expect(target?.name).toBe('A')
    expect(target?.nameP).toEqual([1, 0])
  })

  it('getMaxSizePtWithinCluster 应返回 cluster 中最大尺寸', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0.5] }
      ],
      lines: [
        { id: 1, pts: [1, 2], name: 'L1', nameSub: '', color: '#000', type: 0, ptSize: 3 }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const size = store.getMaxSizePtWithinCluster(1, 'ptSize')
    expect(size).toBe(3)
  })

  it('getRectOfCluster 应返回四角点', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [10, 5] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()
    const cluster = store.getStaClusters()?.[0]

    const rect = store.getRectOfCluster(cluster)

    expect(rect).toContainEqual([10, 5])
    expect(rect).toContainEqual([10, 0])
    expect(rect).toContainEqual([0, 5])
    expect(rect).toContainEqual([0, 0])
  })

  it('getRectOfCluster 对空 cluster 应返回空数组', () => {
    setupSaveStore(createEmptySave())
    const store = useStaClusterStore()
    expect(store.getRectOfCluster(undefined)).toEqual([])
  })

  it('getStaClusterById 应返回点所在 cluster', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0.5] },
        { ...createPoint(3), pos: [100, 100] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const cluster = store.getStaClusterById(1)
    expect(cluster.map(p => p.id).sort()).toEqual([1, 2])
  })

  it('getStaClusterById 对未聚类点应返回单点', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [100, 100] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    const cluster = store.getStaClusterById(2)
    expect(cluster).toHaveLength(1)
    expect(cluster[0].id).toBe(2)
  })

  it('isPtSingle 应正确判断未聚类点', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0.5] },
        { ...createPoint(3), pos: [100, 100] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()

    expect(store.isPtSingle(1)).toBe(false)
    expect(store.isPtSingle(3)).toBe(true)
  })

  it('clearItems 应清空 cluster 缓存并在下次访问时重新计算', () => {
    const save = createEmptySave({
      points: [
        { ...createPoint(1), pos: [0, 0] },
        { ...createPoint(2), pos: [0.5, 0.5] }
      ]
    })
    setupSaveStore(save)
    const store = useStaClusterStore()
    const clustersBefore = store.getStaClusters()

    store.clearItems()

    // clearItems 后内部缓存被清空，再次访问会重新计算，结果应保持一致
    const clustersAfter = store.getStaClusters()
    expect(clustersAfter).toEqual(clustersBefore)
  })
})
