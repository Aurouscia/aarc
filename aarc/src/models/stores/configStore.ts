import { sqrt2 } from "@/utils/consts"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { Config, ConfigInSave } from "../config"
import { useSaveStore } from "./saveStore"
import { ColorPreset, Line, LineType } from "../save"
import { WayRel } from "@/utils/rayUtils/rayParallel"
import rfdc from "rfdc"
import { removeKeyIfSame } from "@/utils/lang/removeKeyIfSame"
import { isKeyOf } from "@/utils/type/IsKeyOf"
import { isZero } from "@/utils/sgn"

// 45°/135° 圆角半径缩放系数（原魔数提取，供 numeric 与 WayRel 分支共用）
// tan(67.5°) = sqrt(2)+1 ≈ 2.4142135
export const turn45Tan67_5 = 2.4142135
// 0.618 为视觉微调系数：45° 圆角比直角略小，135° 略大
export const turn45VisualFactor = 0.618
export const turn45Ratio = turn45Tan67_5 * turn45VisualFactor

export const configDefault:Config = {
    bgColor: '#ffffff',
    bgRefImage: {},

    lineWidth: 14,
    lineCarpetWiden: 7,
    lineTurnAreaRadius: 30,
    lineWidthMapped: {},
    lineExtensionHandleLengthVert: '',
    lineExtensionHandleLengthInc: '',

    ptBareSize: 12,
    ptBareLineWidth: 3,
    ptBareLineColor: '#666666',
    ptBareLineColorSelected: '#000000',
    ptStaSize: 10,
    ptStaLineWidth: 4,
    ptStaFillColor: '#ffffff',
    ptStaExchangeLineColor: '#999999',

    staNameFontSize: 26,
    staNameFont: '',
    staNameFontWeight: '',
    staNameFontStyle: '',
    staNameRowHeight: 30,
    staNameColor: '#000000',
    staNameSubFontSize: 18,
    staNameSubFont: '',
    staNameSubFontWeight: '',
    staNameSubFontStyle: '',
    staNameSubRowHeight: 20,
    staNameSubColor: '#888888',

    gridMainLineColor: '#bbbbbb',
    gridSubLineColor: '#cccccc',

    clickPtThrs: 24,
    clickLineThrs: 12,

    cursorSize: 14,
    cursorLineWidth: 4,

    snapOctaClingPtPtDist: 25,
    snapOctaClingPtNameDist: 18,
    snapOctaRayPtPtThrs: 16,
    snapOctaClingPtPtThrs: 10,
    snapOctaClingPtNameThrs: 8,
    snapOctaRayPtNameThrs: 6,
    snapGridThrs: 6,
    snapRayAngles: ['0', '45', '90', '135'],

    colorPresetArea: '#cccccc',
    colorPresetWater: '#c3e5eb',
    colorPresetGreenland: '#ceeda4',
    colorPresetIsland: '#ffffff',

    textTagFont: '',
    textTagFontWeight: '',
    textTagFontStyle: '',
    textTagFontSizeBase: 30,
    textTagFontColorHex: '#333333',
    textTagRowHeightBase: 34,
    textTagSubFont: '',
    textTagSubFontWeight: '',
    textTagSubFontStyle: '',
    textTagSubFontSizeBase: 16,
    textTagSubRowHeightBase: 18,
    textTagSubFontColorHex: '#999999',
    textTagPlain:{},
    textTagForLine:{},
    textTagForLineDropCap:true,
    textTagForLineDropCapDetect:'classic',
    textTagForTerrain:{},

    pinyinConvert:{},

    configVersion:0
}

export const useConfigStore = defineStore('config', ()=>{
    const deepClone = rfdc()
    const config = ref<Config>(deepClone(configDefault))
    const saveStore = useSaveStore()
    function readConfigFromSave(){
        config.value = deepClone(configDefault)
        if(!saveStore.save?.config)
            return;
        const sc = saveStore.save.config;
        Object.assign(config.value, sc)
        normalizeSnapRayAngles()
    }
    function writeConfigToSave(){
        const configNow = deepClone(config.value)
        removeKeyIfSame(configNow, deepClone(configDefault))
        if(saveStore.save)
            saveStore.save.config = configNow
    }
    function getConfigForExporting(){
        const configNow = deepClone(config.value)
        removeKeyIfSame(configNow, deepClone(configDefault))
        return configNow
    }
    function importConfig(c:ConfigInSave){
        console.log('正在导入配置：', deepClone(c))
        Object.assign(config.value, c)
        const validKeys = Object.keys(configDefault)
        for(const k in config.value){
            if(!validKeys.includes(k) && isKeyOf(k, config.value)){
                delete config.value[k]
            }
        }
        normalizeSnapRayAngles()
        console.log('写入后的配置：', deepClone(config.value))
    }

    /** 确保 snapRayAngles 为字符串数组（兼容旧存档/手动编辑的 number[]） */
    function normalizeSnapRayAngles(){
        const raw = config.value.snapRayAngles
        if(!Array.isArray(raw)){
            config.value.snapRayAngles = [...configDefault.snapRayAngles]
            return
        }
        config.value.snapRayAngles = raw.map(v => String(v))
    }

    const clickPtThrsSq = computed<number>(()=>
        config.value.clickPtThrs ** 2)
    const clickLineThrsSq = computed<number>(()=>
        config.value.clickLineThrs ** 2)
    const clickLineThrs_sqrt2_sq = computed<number>(()=>
        (config.value.clickLineThrs * sqrt2) ** 2)
    const snapOctaClingPtNameThrsSq = computed<number>(()=>
        config.value.snapOctaClingPtNameThrs ** 2)
    
    function getPresetColor(presetType:ColorPreset){
        if(presetType == ColorPreset.water)
            return config.value.colorPresetWater
        if(presetType == ColorPreset.greenland)
            return config.value.colorPresetGreenland
        if(presetType == ColorPreset.area)
            return config.value.colorPresetArea
        if(presetType == ColorPreset.island)
            return config.value.colorPresetIsland
        return 'black'
    }
    function getTurnRadiusOf(line:Line|number, turnRel:WayRel|number, justify:'outer'|'middle'|'inner' = 'inner'){
        let lineWidthRatio = (typeof line == 'number' ? line : line.width) || 1
        let base = config.value.lineTurnAreaRadius;
        if(typeof line !== 'number' && line.type===LineType.common)
            base *= lineWidthRatio
        let radius:number
        if(justify==='middle'){
            radius = base
        }else{
            const justifyBy = config.value.lineWidth * lineWidthRatio / 2
            radius = justify==='outer' ? base - justifyBy : base + justifyBy
        }
        if(radius<0)
            radius = 0
        // 任意角度（以弧度传入）时，默认半径保持与 90° 相同；
        // 若接近 45° 或 135°，则保持与原 8 方向一致的行为。
        else if(typeof turnRel === 'number'){
            if(isZero(turnRel - Math.PI / 4))
                radius /= turn45Ratio
            else if(isZero(turnRel - 3 * Math.PI / 4))
                radius *= turn45Ratio
        }
        else if(turnRel === '45')
            radius /= turn45Ratio
        else if(turnRel === '135'){
            radius *= turn45Ratio
        }
        return radius
    }

    return { 
        config, readConfigFromSave, writeConfigToSave,
        getConfigForExporting, importConfig,
        clickPtThrsSq, clickLineThrsSq, clickLineThrs_sqrt2_sq, 
        snapOctaClingPtNameThrsSq,
        getPresetColor, getTurnRadiusOf
    }
})