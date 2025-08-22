import { sqrt2 } from "@/utils/consts"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { Config } from "../config"
import { useSaveStore } from "./saveStore"
import { ColorPreset, Line, LineType } from "../save"
import { WayRel } from "@/utils/rayUtils/rayParallel"
import rfdc from "rfdc"
import { removeKeyIfSame } from "@/utils/lang/removeKeyIfSame"

export const configDefault:Config = {
    bgColor: '#ffffff',
    bgRefImage: {},

    lineWidth: 14,
    lineTurnAreaRadius: 30,
    lineWidthMapped: {},
    lineExtensionHandleLengthVert: '',
    lineExtensionHandleLengthInc: '',
    lineRemoveCarpet:false,//所有线路白边

    ptBareSize: 12,
    ptBareLineWidth: 3,
    ptBareLineColor: '#666666',
    ptBareLineColorSelected: '#000000',
    ptStaSize: 10,
    ptStaLineWidth: 4,
    ptStaFillColor: '#ffffff',
    ptStaExchangeLineColor: '#999999',
    ptStaNormalStaFollowLineColor:true,//普通站颜色是否跟随线路颜色
    ptStaNormalStaColor:'#000000',//如果上面那个不跟随，那么是什么颜色

    staNameFontSize: 26,
    staNameFont: 'microsoft YaHei',
    staNameRowHeight: 30,
    staNameColor: '#000000',
    staNameSubFontSize: 18,
    staNameSubFont: 'microsoft YaHei',
    staNameSubRowHeight: 20,
    staNameSubColor: '#888888',
    staNameRemoveCarpet:false,//所有站名白边

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
    colorPresetIsland: '#ffffff',//现在应该跟随背景颜色

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
    textTagRemoveCarpet:false,//所有文本标签白边

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
    }
    function writeConfigToSave(){
        const configNow = deepClone(config.value)
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
            return config.value.bgColor
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

    return { 
        config, readConfigFromSave, writeConfigToSave,
        staNameFontStr, staNameFontSubStr,
        clickPtThrsSq, clickLineThrsSq, clickLineThrs_sqrt2_sq, 
        snapOctaClingPtPtThrsSq, snapOctaClingPtNameThrsSq,
        textTagFontStr, textTagSubFontStr,
        getPresetColor, getTurnRadiusOf
    }
})