import { AllKeysOptional } from "@/utils/type/AllKeysOptional"

export interface Config{
    bgColor: string,

    lineWidth: number,
    lineTurnAreaRadius: number,

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
    textTagRowHeightBase: number,
    textTagSubFont: string,
    textTagSubFontSizeBase: number,
    textTagSubRowHeightBase: number,
}

export type ConfigInSave = AllKeysOptional<Config>