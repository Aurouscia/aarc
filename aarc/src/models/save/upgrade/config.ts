import { ConfigInSave } from "@/models/config"
import { Save } from "@/models/save"

export const freshNewConfigVersion = 1
export function initFreshNewConfig(save:Save){
    save.config.configVersion = freshNewConfigVersion
    save.config.textTagForLine ??= {}
    save.config.textTagForLine.edgeAnchorOutsidePadding = true
    console.log('[初始化]配置')
}
export function upgradeConfig(save:Save) {
    const ver = save.config.configVersion ?? 0
    if(ver < 1) {
        save.config.configVersion = 1
        upgradeTo1(save.config)
        console.log('[升级]配置:1')
    }
}

function upgradeTo1(sc: ConfigInSave){
    // 旧版中，默认线路名标签为“文本居中”且“锚点在左侧”
    // 为了确保一致性，若对象的configVersion较旧，将上述两个属性设为旧版的值
    if (!sc.textTagForLine) {
        sc.textTagForLine = {}
    }
    sc.textTagForLine.anchorX = 1
    sc.textTagForLine.textAlign = 0
}