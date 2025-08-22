import { AllKeysOptional } from "@/utils/type/AllKeysOptional"
import { SgnNumber } from "./coord"

export interface Config{
    bgColor: string,
    bgRefImage: BgRefImageConfig,

    lineWidth: number,
    lineTurnAreaRadius: number,
    lineWidthMapped: LineWidthMappedConfig
    lineExtensionHandleLengthVert: string,
    lineExtensionHandleLengthInc: string,
    lineRemoveCarpet:boolean,//所有线路白边

    ptBareSize: number,
    ptBareLineWidth: number,
    ptBareLineColor: string,
    ptBareLineColorSelected: string,
    ptStaSize: number,
    ptStaLineWidth: number,
    ptStaFillColor: string,
    ptStaExchangeLineColor: string,
    ptStaNormalStaFollowLineColor:boolean,//普通站颜色是否跟随线路颜色
    ptStaNormalStaColor:string,//如果上面那个不跟随，那么是什么颜色

    staNameFontSize: number,
    staNameFont: string,
    staNameRowHeight: number,
    staNameColor: string,
    staNameSubFontSize: number,
    staNameSubFont: string,
    staNameSubRowHeight: number,
    staNameSubColor: string,
    staNameRemoveCarpet:boolean,//所有站名白边

    gridMainLineColor: string,
    gridSubLineColor: string,

    clickPtThrs: number,
    clickLineThrs: number,

    cursorSize: number,
    cursorLineWidth: number,

    snapOctaClingPtPtDist: number,
    snapOctaClingPtNameDist: number,
    snapOctaRayPtPtThrs: number,
    snapOctaClingPtPtThrs: number,
    snapOctaClingPtNameThrs: number,
    snapOctaRayPtNameThrs: number,
    snapGridThrs: number,

    colorPresetArea: string,
    colorPresetWater :string,
    colorPresetGreenland: string,
    colorPresetIsland: string,//现在应该跟随背景颜色

    textTagFont: string,
    textTagFontSizeBase: number,
    textTagFontColorHex: string,
    textTagRowHeightBase: number,
    textTagSubFont: string,
    textTagSubFontSizeBase: number,
    textTagSubFontColorHex: string,
    textTagSubRowHeightBase: number,
    textTagPlain:TextTagPerTypeGlobalConfig,
    textTagForLine:TextTagPerTypeGlobalConfig,
    textTagForLineDropCap:boolean
    textTagForTerrain:TextTagPerTypeGlobalConfig
    textTagRemoveCarpet:boolean,//所有文本标签白边

    pinyinConvert?:PinyinConvertConfig

    configVersion:number
}
export type LineWidthMappedConfig = Record<string, {
    staSize?:number,
    staNameSize?:number
}|undefined>
export type BgRefImageConfig = {
    url?: string,
    opacity?: number,
    left?: number,
    right?: number,
    top?: number,
    bottom?: number,
    width?: number,
    height?: number,
}
export type TextTagPerTypeGlobalConfig = {
    padding?: number,
    fontSize?: number,
    subFontSize?: number,
    textAlign?: SgnNumber,
    anchorX?: SgnNumber,
    anchorY?: SgnNumber,
    width?: number,
    edgeAnchorOutsidePadding?: boolean
}
export type PinyinConvertConfig = {
    rules?:string,
    caseType?:number,
    spaceBetweenChars?:boolean
}

export type ConfigInSave = AllKeysOptional<Config>