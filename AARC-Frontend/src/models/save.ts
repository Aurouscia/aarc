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
    name:string,
    url?:string,
    width?:number
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
export function ensureValidSave(obj:any){
    let freshNew = false
    if(typeof obj != 'object'){
        obj = {}
        freshNew = true
    }
    const ownPropNames = Object.getOwnPropertyNames(obj)
    const fillDefault = (propName:keyof Save, mustBe:'array'|'object'|'number', defaultVal:object|(()=>object))=>{
        let needFill = false
        if(!ownPropNames.includes(propName))
            needFill = true
        else{
            const value = obj[propName]
            if(mustBe == 'array'){
                needFill = !(value instanceof Array)
            }else if(mustBe == 'object'){
                needFill = !(value instanceof Object) 
            }else if(mustBe == 'number'){
                needFill = !(typeof value === 'number')
            }
        }
        if(needFill){
            console.warn(`属性"${propName}"缺失，已使用默认值补充`)
            if(typeof defaultVal === 'object')
                obj[propName] = defaultVal
            else
                obj[propName] = defaultVal()
        }
    }
    fillDefault('lines', 'array', [])
    fillDefault('points', 'array', [])
    fillDefault('cvsSize', 'array', [1000, 1000]),
    fillDefault('textTags', 'array', [])
    fillDefault('config', 'object', {})
    fillDefault('idIncre', 'number', ()=>recaculateIdIncre(obj))
    //确认了idIncre有值后，才能进行下面的“全新存档初始化”步骤（会使idIncre自增）
    const getNewId = ()=>obj.idIncre++
    if(freshNew){
        fillDefault('lineStyles', 'array', ()=>defaultLineStyles(getNewId))
    }
    ensureValidCvsSize(obj)
    return obj as Save
}
function recaculateIdIncre(save:Save){
    const lineIds = save.lines.map(x=>x.id)
    const ptIds = save.points.map(x=>x.id)
    const ttIds = save.textTags.map(x=>x.id)
    const lsIds = save.lineStyles?.map(x=>x.id) ?? []
    const lgIds = save.lineGroups?.map(x=>x.id) ?? []
    const allIds = [...lineIds, ...ptIds, ...ttIds, ...lsIds, ...lgIds]
    if(allIds.length===0)
        return 1
    const maxId = Math.max(...allIds)
    return maxId + 1
}
function defaultLineStyles(getNewId:()=>number):LineStyle[]{
    return [
        {
            id: getNewId(),
            name: '快线',
            layers:[
                {color:'#FFFFFF', width:0.15, opacity:1}
            ]
        },
        {
            id: getNewId(),
            name: '铁路',
            layers:[
                {color:'#FFFFFF', width:0.6, opacity:1, dash:'4 4'}
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