import { Coord } from "./coord";

export interface Save{
    idIncre: number
    points: ControlPoint[]
    lines: Line[]
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
}


export interface Line{
    id:number
    pts: number[]
    name:string
    nameSub:string
    color:string
}