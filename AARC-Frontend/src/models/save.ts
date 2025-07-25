import { ConfigInSave } from "./config";
import { Coord, SgnNumber } from "./coord";

export interface Save{
    idIncre: number //所有元素共用的唯一id新建时从此处取，取一个之后其自增1（初始为1）
    points: ControlPoint[]
    pointLinks?: ControlPointLink[]
    lines: Line[]
    lineStyles?: LineStyle[]
    lineGroups?: LineGroup[]
    textTags: TextTag[]
    textTagIcons?: TextTagIcon[]
    cvsSize: Coord
    config: ConfigInSave
    meta: SaveMetaData
}


export enum ControlPointDir{
    vertical = 0,
    incline = 1
}
export enum ControlPointSta{
    plain = 0,
    sta = 1
}
export interface ControlPoint{
    id:number
    pos:Coord
    dir:ControlPointDir
    sta:ControlPointSta
    name?:string
    nameS?:string
    nameP?:Coord
    nameSize?:number
}

export enum ControlPointLinkType{
    fat = 0,
    thin = 1,
    dot = 2, 
    dotCover = 3
}
export interface ControlPointLink{
    pts:number[]
    type:ControlPointLinkType
}

export enum ColorPreset{
    none = 0,
    area = 1,
    water = 2,
    greenland = 3,
    island = 4
}
export enum LineType{
    common = 0,
    terrain = 1
}
export interface Line{
    id:number
    pts:number[]
    name:string
    nameSub:string
    color:string
    colorPre?:ColorPreset
    group?:number
    width?:number
    ptNameSize?:number
    ptSize?:number
    type:LineType
    isFilled?:boolean
    style?:number
    tagTextColor?:string
    zIndex?:number
    parent?:number
    isFake?:boolean
    removeCarpet?:boolean
}
export interface LineStyle{
    id:number
    name?:string
    layers:{
        color?:string
        colorMode?:'fixed'|'line' //undefined默认为fixed
        width?:number
        opacity?:number
        dash?:string
    }[]
}
export interface LineGroup{
    id:number
    name?:string
    lineType:LineType
}

export enum FormalRotation{
    horizontal = 0,
    left135 = -3,
    left90 = -2,
    left45 = -1,
    right45 = 1,
    right90 = 2,
    right135 = 3,
    right180 = 4
}
export interface TextTag{
    id:number
    pos:Coord
    forId?:number
    text?:string
    textS?:string
    textOp?:TextOptions
    textSOp?:TextOptions
    padding?:number
    textAlign?:SgnNumber|null //undefined表示“使用全局设置”，null表示“跟随anchorX”
    width?:number
    anchorX?:SgnNumber
    anchorY?:SgnNumber
    dropCap?:boolean
    icon?:number
    removeCarpet?:boolean
    //rot?:FormalRotation
}
export interface TextOptions{
    size:number
    color:string
    //i?:boolean
    //b?:boolean
    //u?:boolean
}

export interface TextTagIcon{
    id:number,
    name?:string,
    url?:string,
    width?:number
}

export interface SaveMetaData{
    lineStylesVersion?: number,
    textTagIconsVersion?: number
}

export function saveStaCount(save:Save){
    let staCount = 0
    for(let s of save.points){
        if(s.sta === ControlPointSta.sta)
            staCount+=1
    }
    return staCount
}
export function saveLineCount(save:Save){
    let lineCount = 0
    for(let line of save.lines){
        if(line.type === LineType.common && !line.parent && !line.isFake)
            lineCount+=1
    }
    return lineCount
}