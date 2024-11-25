import { ConfigInSave } from "./config";
import { Coord } from "./coord";

export interface Save{
    idIncre: number //所有元素共用的唯一id新建时从此处取，取一个之后其自增1（初始为1）
    points: ControlPoint[]
    lines: Line[]
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
    //width?:number
    type:LineType
    //isFilled?:boolean
}