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
    lineRemoveCarpet:boolean

    ptBareSize: number,
    ptBareLineWidth: number,
    ptBareLineColor: string,
    ptBareLineColorSelected: string,
    ptStaSize: number,
    ptStaLineWidth: number,
    ptStaFillColor: string,
    ptStaExchangeLineColor: string,

    staNameFontSize: number,
    staNameFont: string,
    staNameRowHeight: number,
    staNameColor: string,
    staNameSubFontSize: number,
    staNameSubFont: string,
    staNameSubRowHeight: number,
    staNameSubColor: string,
    staNameRemoveCarpet:boolean

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
    colorPresetIsland: string

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
    textTagRemoveCarpet:boolean

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

export type ConfigInSave = AllKeysOptional<Config>