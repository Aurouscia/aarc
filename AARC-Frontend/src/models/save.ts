import { ConfigInSave } from "./config";
import { Coord } from "./coord";

export interface Save{
    idIncre: number //所有元素共用的唯一id新建时从此处取，取一个之后其自增1（初始为1）
    points: ControlPoint[]
    lines: Line[]
    lineStyles?: LineStyle[]
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
    pts:number[]
    name:string
    nameSub:string
    color:string
    colorPre?:ColorPreset
    width?:number
    ptNameSize?:number
    ptSize?:number
    type:LineType
    isFilled?:boolean
    style?:number
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
    //rot?:FormalRotation
}
export interface TextOptions{
    size:number
    color:string
    //i?:boolean
    //b?:boolean
    //u?:boolean
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
        if(line.type === LineType.common)
            lineCount+=1
    }
    return lineCount
}
export function ensureValidSave(obj:any){
    if(typeof obj != 'object')
        obj = {}
    const ownPropNames = Object.getOwnPropertyNames(obj)
    const fillDefault = (propName:keyof Save, defaultVal:object|(()=>object))=>{
        if(!ownPropNames.includes(propName)){
            if(typeof defaultVal === 'object')
                obj[propName] = defaultVal
            else
                obj[propName] = defaultVal()
        }
    }
    fillDefault('lines', [])
    fillDefault('points', [])
    fillDefault('cvsSize', [1000, 1000]),
    fillDefault('textTags', [])
    fillDefault('config', {})
    fillDefault('idIncre', ()=>recaculateIdIncre(obj))
    fillDefault('lineStyles', ()=>defaultLineStyles(obj))
    ensureValidCvsSize(obj)
    return obj as Save
}
function recaculateIdIncre(save:Save){
    const lineIds = save.lines.map(x=>x.id)
    const ptIds = save.points.map(x=>x.id)
    const ttIds = save.textTags.map(x=>x.id)
    const allIds = [...lineIds, ...ptIds, ...ttIds]
    if(allIds.length===0)
        return 1
    const maxId = Math.max(...allIds)
    return maxId + 1
}
function defaultLineStyles(save:Save):LineStyle[]{
    return [
        {
            id: save.idIncre++,
            name: '快线',
            layers:[
                {color:'#FFFFFF', width:0.3, opacity:1}
            ]
        },
        {
            id: save.idIncre++,
            name: '铁路',
            layers:[
                {colorMode:'line', width:0.7, opacity:1, dash:'4 4'},
                {color:'#FFFFFF', width:0.7}
            ]
        }
    ]
}

export const minCvsSide = 500
export function ensureValidCvsSize(save:Save){
    if(save.cvsSize[0] < minCvsSide)
        save.cvsSize[0] = minCvsSide
    if(save.cvsSize[1] < minCvsSide)
        save.cvsSize[1] = minCvsSide
}