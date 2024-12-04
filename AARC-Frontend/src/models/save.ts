import { ConfigInSave } from "./config";
import { Coord } from "./coord";

export interface Save{
    idIncre: number //所有元素共用的唯一id新建时从此处取，取一个之后其自增1（初始为1）
    points: ControlPoint[]
    lines: Line[]
    textTags: TextTag[]
    cvsSize: Coord
    config: ConfigInSave
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
    pts: number[]
    name:string
    nameSub:string
    color:string
    colorPre?:ColorPreset
    width?:number
    type:LineType
    isFilled?:boolean
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
    //rot?:FormalRotation
}