import { ColorPreset } from "@/models/save"
import { useConfigStore } from "@/models/stores/configStore"

type PresetName = '水系'|'绿地'|'岛屿'|'区域'

export function useColorPresetNames(){
    const cs = useConfigStore()
    const presets:{name:PresetName, colorHex:string, code:ColorPreset}[] = 
    [
        {name: '水系', colorHex:cs.config.colorPresetWater, code:ColorPreset.water},
        {name: '绿地', colorHex:cs.config.colorPresetGreenland, code:ColorPreset.greenland},
        {name: '岛屿', colorHex:cs.config.bgColor, code:ColorPreset.island},
        {name: '区域', colorHex:cs.config.colorPresetArea, code:ColorPreset.area}
    ]
    function getPresetNameByEnum(cp:ColorPreset|undefined):PresetName|undefined{
        let name = presets.find(x=>x.code===cp)?.name
        return name
    }
    function getPresetEnumByName(name:string|undefined):ColorPreset|undefined{
        let code = presets.find(x=>x.name===name)?.code
        return code
    }
    return { presets, getPresetNameByEnum, getPresetEnumByName }
}