import { describe, it, expect } from 'vitest'
import { upgradeConfig, initFreshNewConfig, freshNewConfigVersion } from '@/models/save/upgrade/config'
import { upgradeLineStyles, initFreshNewLineStyles } from '@/models/save/upgrade/lineStyles'
import { upgradePatterns, initFreshNewPatterns } from '@/models/save/upgrade/patterns'
import { upgradeTextTagIcons } from '@/models/save/upgrade/textTagIcons'
import { initFreshNewTextTags } from '@/models/save/upgrade/textTags'
import { Save } from '@/models/save'

function makeMinimalSave(): Save {
  return {
    idIncre: 1,
    points: [],
    lines: [],
    cvsSize: [1000, 1000],
    textTags: [],
    config: {} as any,
    meta: {}
  }
}

describe('upgradeConfig', () => {
  it('ver<1 时应升级到 v1', () => {
    const save = makeMinimalSave()
    save.config = {} as any
    upgradeConfig(save)
    expect(save.config.configVersion).toBe(1)
    expect(save.config.textTagForLine).toBeDefined()
    expect(save.config.textTagForLine!.anchorX).toBe(1)
    expect(save.config.textTagForLine!.textAlign).toBe(0)
  })

  it('ver>=1 时不应修改配置', () => {
    const save = makeMinimalSave()
    save.config = { configVersion: 1, textTagForLine: { anchorX: 0, textAlign: 1 } } as any
    upgradeConfig(save)
    expect(save.config.textTagForLine!.anchorX).toBe(0)
    expect(save.config.textTagForLine!.textAlign).toBe(1)
  })
})

describe('initFreshNewConfig', () => {
  it('应设置 configVersion 和 edgeAnchorOutsidePadding', () => {
    const save = makeMinimalSave()
    save.config = {} as any
    initFreshNewConfig(save)
    expect(save.config.configVersion).toBe(freshNewConfigVersion)
    expect(save.config.textTagForLine).toBeDefined()
    expect(save.config.textTagForLine!.edgeAnchorOutsidePadding).toBe(true)
  })
})

describe('upgradeLineStyles', () => {
  it('ver<1 时应将 dashCap 重命名为 cap', () => {
    const save = makeMinimalSave()
    save.lineStyles = [
      {
        id: 1, name: 'test', layers: [
          { color: '#fff', dashCap: 'round' as any },
          { color: '#000' }
        ]
      }
    ] as any
    save.meta.lineStylesVersion = 0
    upgradeLineStyles(save, () => save.idIncre++)
    expect(save.meta.lineStylesVersion).toBe(1)
    expect(save.lineStyles![0].layers[0].cap).toBe('round')
    expect('dashCap' in save.lineStyles![0].layers[0]).toBe(false)
    expect(save.lineStyles![0].layers[1].cap).toBeUndefined()
  })

  it('ver>=1 时不应修改 lineStyles', () => {
    const save = makeMinimalSave()
    save.lineStyles = [{ id: 1, name: 'test', layers: [{ cap: 'butt' }] }] as any
    save.meta.lineStylesVersion = 1
    upgradeLineStyles(save, () => save.idIncre++)
    expect(save.lineStyles![0].layers[0].cap).toBe('butt')
  })

  it('lineStyles 为 undefined 且 ver<1 时应初始化为空数组', () => {
    const save = makeMinimalSave()
    save.meta.lineStylesVersion = 0
    upgradeLineStyles(save, () => save.idIncre++)
    expect(save.lineStyles).toEqual([])
    expect(save.meta.lineStylesVersion).toBe(1)
  })
})

describe('initFreshNewLineStyles', () => {
  it('应添加默认线路样式', () => {
    const save = makeMinimalSave()
    initFreshNewLineStyles(save, () => save.idIncre++)
    expect(save.lineStyles!.length).toBe(2)
    expect(save.lineStyles![0].name).toBe('快线')
    expect(save.lineStyles![1].name).toBe('铁路')
    expect(save.lineStyles![1].layers[0].dash).toBe('4 4')
  })
})

describe('upgradePatterns', () => {
  it('ver<1 时预留逻辑不应报错', () => {
    const save = makeMinimalSave()
    save.patterns = []
    save.meta.patternsVersion = 0
    upgradePatterns(save, () => save.idIncre++)
    expect(save.patterns).toEqual([])
  })
})

describe('initFreshNewPatterns', () => {
  it('应添加默认 pattern', () => {
    const save = makeMinimalSave()
    initFreshNewPatterns(save, () => save.idIncre++)
    expect(save.patterns!.length).toBe(1)
    expect(save.patterns![0].name).toBe('网格')
    expect(save.patterns![0].grid!.rise45).toBe(true)
  })
})

describe('upgradeTextTagIcons', () => {
  it('ver<1 时应添加默认图标', () => {
    const save = makeMinimalSave()
    save.textTagIcons = []
    save.meta.textTagIconsVersion = 0
    upgradeTextTagIcons(save, () => save.idIncre++)
    expect(save.meta.textTagIconsVersion).toBe(1)
    expect(save.textTagIcons.length).toBe(2)
    expect(save.textTagIcons[0].name).toBe('a-机场')
    expect(save.textTagIcons[1].name).toBe('a-火车')
  })

  it('ver>=1 时不应重复添加图标', () => {
    const save = makeMinimalSave()
    save.textTagIcons = [{ id: 1, name: 'existing' }]
    save.meta.textTagIconsVersion = 1
    upgradeTextTagIcons(save, () => save.idIncre++)
    expect(save.textTagIcons.length).toBe(1)
  })
})

describe('initFreshNewTextTags', () => {
  it('应添加新手引导文本标签', () => {
    const save = makeMinimalSave()
    initFreshNewTextTags(save, () => save.idIncre++)
    expect(save.textTags.length).toBe(1)
    expect(save.textTags[0].text).toContain('线路')
    expect(save.textTags[0].anchorY).toBe(1)
  })
})
