import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPinia } from '../../helpers/piniaTestHelper'
import { useConfigStore } from '@/models/stores/configStore'
import { LineType } from '@/models/save'

describe('configStore - getTurnRadiusOf', () => {
  beforeEach(() => {
    createTestPinia()
  })

  it('90° inner 半径 = base + lineWidth*width/2', () => {
    const cs = useConfigStore()
    const line = { id: 1, pts: [], name: '', nameSub: '', color: '', type: LineType.common, width: 1 }
    const expected = cs.config.lineTurnAreaRadius + cs.config.lineWidth / 2
    expect(cs.getTurnRadiusOf(line, '90')).toBeCloseTo(expected)
  })

  it('90° middle 半径等于 base（无 justify 偏移）', () => {
    const cs = useConfigStore()
    const line = { id: 1, pts: [], name: '', nameSub: '', color: '', type: LineType.common, width: 1 }
    expect(cs.getTurnRadiusOf(line, '90', 'middle')).toBeCloseTo(cs.config.lineTurnAreaRadius)
  })

  it('45° 转角半径小于 90° 半径', () => {
    const cs = useConfigStore()
    const line = { id: 1, pts: [], name: '', nameSub: '', color: '', type: LineType.common, width: 1 }
    const r90 = cs.getTurnRadiusOf(line, '90')
    const r45 = cs.getTurnRadiusOf(line, '45')
    expect(r45).toBeLessThan(r90)
  })

  it('135° 转角半径大于 90° 半径', () => {
    const cs = useConfigStore()
    const line = { id: 1, pts: [], name: '', nameSub: '', color: '', type: LineType.common, width: 1 }
    const r90 = cs.getTurnRadiusOf(line, '90')
    const r135 = cs.getTurnRadiusOf(line, '135')
    expect(r135).toBeGreaterThan(r90)
  })

  it('平行转角返回与 90° 相同的基础半径', () => {
    const cs = useConfigStore()
    const line = { id: 1, pts: [], name: '', nameSub: '', color: '', type: LineType.common, width: 1 }
    expect(cs.getTurnRadiusOf(line, 'parallel')).toBeCloseTo(
      cs.getTurnRadiusOf(line, '90')
    )
  })

  it('普通线路随 width 倍率放大基础半径', () => {
    const cs = useConfigStore()
    const lineWidth2 = { id: 1, pts: [], name: '', nameSub: '', color: '', type: LineType.common, width: 2 }
    const lineWidth1 = { id: 2, pts: [], name: '', nameSub: '', color: '', type: LineType.common, width: 1 }
    expect(cs.getTurnRadiusOf(lineWidth2, '90', 'middle')).toBeCloseTo(
      cs.getTurnRadiusOf(lineWidth1, '90', 'middle') * 2
    )
  })

  it('地形线路的 base 不受 width 倍率影响，但 justifyBy 仍受影响', () => {
    const cs = useConfigStore()
    const terrainLine = { id: 1, pts: [], name: '', nameSub: '', color: '', type: LineType.terrain, width: 2 }
    // middle 模式下无 justifyBy，base 不变
    expect(cs.getTurnRadiusOf(terrainLine, '90', 'middle')).toBeCloseTo(cs.config.lineTurnAreaRadius)
  })

  it('传入 number 作为 width 倍率只影响 justifyBy，不影响 base', () => {
    const cs = useConfigStore()
    const r1 = cs.getTurnRadiusOf(1, '90', 'middle')
    const r2 = cs.getTurnRadiusOf(2, '90', 'middle')
    expect(r1).toBeCloseTo(r2)
    expect(r1).toBeCloseTo(cs.config.lineTurnAreaRadius)
  })

  it('不同 justify 模式产生预期大小关系', () => {
    const cs = useConfigStore()
    const line = { id: 1, pts: [], name: '', nameSub: '', color: '', type: LineType.common, width: 1 }
    const inner = cs.getTurnRadiusOf(line, '90', 'inner')
    const middle = cs.getTurnRadiusOf(line, '90', 'middle')
    const outer = cs.getTurnRadiusOf(line, '90', 'outer')

    expect(inner).toBeGreaterThan(middle)
    expect(middle).toBeGreaterThan(outer)
  })

  it('outer 模式下半径不会为负数', () => {
    const cs = useConfigStore()
    const line = { id: 1, pts: [], name: '', nameSub: '', color: '', type: LineType.common, width: 1 }
    expect(cs.getTurnRadiusOf(line, '135', 'outer')).toBeGreaterThanOrEqual(0)
  })
})
