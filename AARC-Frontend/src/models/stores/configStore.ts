import { sqrt2 } from "@/utils/consts"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { Config } from "../config"
import { useSaveStore } from "./saveStore"
import { ColorPreset, Line, LineType } from "../save"
import { WayRel } from "@/utils/rayUtils/rayParallel"
import rfdc from "rfdc"
import { removeKeyIfSame } from "@/utils/lang/removeKeyIfSame"
import { AllKeysOptional } from "@/utils/type/AllKeysOptional"

export const configDefault:Config = {
    bgColor: '#ffffff',
    bgRefImage: {},

    lineWidth: 14,
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
    staNameFont: 'microsoft YaHei',
    staNameRowHeight: 30,
    staNameColor: '#000000',
    staNameSubFontSize: 18,
    staNameSubFont: 'microsoft YaHei',
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

    colorPresetArea: '#cccccc',
    colorPresetWater: '#c3e5eb',
    colorPresetGreenland: '#ceeda4',
    colorPresetIsland: '#ffffff',

    textTagFont: 'microsoft YaHei',
    textTagFontSizeBase: 30,
    textTagFontColorHex: '#333333',
    textTagRowHeightBase: 34,
    textTagSubFont: 'microsoft YaHei',
    textTagSubFontSizeBase: 16,
    textTagSubRowHeightBase: 18,
    textTagSubFontColorHex: '#999999',
    textTagPlain:{},
    textTagForLine:{},
    textTagForLineDropCap:true,
    textTagForTerrain:{},

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
        makeSureCompatibilityWhenReading(sc)
        Object.assign(config.value, sc)
    }
    function writeConfigToSave(){
        const configNow = deepClone(config.value)
        //注意：修改removeKeyIfSame前，关注makeSureCompatibilityWhenReading的逻辑
        removeKeyIfSame(configNow, deepClone(configDefault))
        if(saveStore.save)
            saveStore.save.config = configNow
    }

    const staNameFontStr = computed<string>(()=>
        `${config.value.staNameFontSize}px ${config.value.staNameFont}`)
    const staNameFontSubStr = computed<string>(()=>
        `${config.value.staNameSubFontSize}px ${config.value.staNameSubFont}`)
    const clickPtThrsSq = computed<number>(()=>
        config.value.clickPtThrs ** 2)
    const clickLineThrsSq = computed<number>(()=>
        config.value.clickLineThrs ** 2)
    const clickLineThrs_sqrt2_sq = computed<number>(()=>
        (config.value.clickLineThrs * sqrt2) ** 2) 
    const snapOctaClingPtPtThrsSq = computed<number>(()=>
        config.value.snapOctaClingPtPtThrs ** 2)
    const snapOctaClingPtNameThrsSq = computed<number>(()=>
        config.value.snapOctaClingPtNameThrs ** 2)
    const textTagFontStr = (ratio:number = 1)=>
        `${config.value.textTagFontSizeBase * ratio}px ${config.value.textTagFont}`
    const textTagSubFontStr = (ratio:number = 1)=>
        `${config.value.textTagSubFontSizeBase * ratio}px ${config.value.textTagSubFont}`
    
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
    function getTurnRadiusOf(line:Line|number, turnRel:WayRel, justify:'outer'|'middle'|'inner' = 'inner'){
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
        //tan(67.5°)=2.4142135
        //0.618 仅仅是我感觉比直角小点好看些，但是又不知道缩小多少合适
        else if(turnRel === '45')
            radius /= 2.4142135*0.618 
        else if(turnRel === '135'){
            radius *= 2.4142135*0.618
        }
        return radius
    }

    function makeSureCompatibilityWhenReading(sc:AllKeysOptional<Config>){
        const ver = sc.configVersion ?? 0
        if(ver < 1){
            // 旧版中，默认线路名标签为“文本居中”且“锚点在左侧”
            // 为了确保一致性，若对象的configVersion较旧，将上述两个属性设为旧版的值
            if(!sc.textTagForLine){
                sc.textTagForLine = {}
            }
            sc.textTagForLine.anchorX = 1
            sc.textTagForLine.textAlign = 0
            sc.configVersion = 1
            console.log('已运行ver=1的config兼容性设置')
        }
        //有需要时，继续往后加ver条件和赋值
    }

    return { 
        config, readConfigFromSave, writeConfigToSave,
        staNameFontStr, staNameFontSubStr,
        clickPtThrsSq, clickLineThrsSq, clickLineThrs_sqrt2_sq, 
        snapOctaClingPtPtThrsSq, snapOctaClingPtNameThrsSq,
        textTagFontStr, textTagSubFontStr,
        getPresetColor, getTurnRadiusOf
    }
})