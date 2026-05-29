import { ConfigInSave } from "./config";
import { Coord, SgnNumber } from "./coord";

export interface Save{
    idIncre: number //所有元素共用的唯一id新建时从此处取，取一个之后其自增1（初始为1）
    points: ControlPoint[]
    pointLinks?: ControlPointLink[]
    lines: Line[]
    lineStyles?: LineStyle[]
    lineGroups?: LineGroup[]
    // ⚠️ 新增 slice 类型后，必须在"规范化"相关逻辑中补充（如 saveNormalize.ts、sliceResolver.ts 等）
    styleSlices?: StyleSlice[]
    timeSlices?: TimeSlice[]
    textTags: TextTag[]
    textTagIcons?: TextTagIcon[]
    patterns?: Pattern[]
    dataSources?: DataSource[]
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
    anchorX?:SgnNumber
    anchorY?:SgnNumber
    noLeader?:boolean
}

export enum ControlPointLinkType{
    fat = 0,
    thin = 1,
    dot = 2, 
    dotCover = 3,
    cluster = 4
}
export interface ControlPointLink{
    pts:[number, number]
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
    /**
     * 线路经过的点ID序列，按线路走向顺序排列。
     *
     * ⚠️ **不能随意交换头尾！** 点的顺序决定了线路的绘制方向、
     * 站点排列顺序以及 Slice 端点的解析结果（见 {@link resolveSliceEndpoints}）。
     * 环线允许头尾相同（pts[0] === pts[last]）。
     */
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
    time?: LineTimeInfo
    cap?: CanvasLineCap
}
export interface LineTimeInfo{
    propose?: number
    construct?: number
    open?: number
    suspend?: [number, number][]
    abandon?: number
}
export interface LineStyle{
    id:number
    name?:string
    noBase?: boolean
    layers:{
        color?:string
        colorMode?:'fixed'|'line' //undefined默认为fixed
        width?:number
        opacity?:number
        dash?:string
        cap?:CanvasLineCap,
        pattern?:number
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
    dropCapLength?:number
    icon?:number
    opacity?:number
    removeCarpet?:boolean
    sunken?:boolean
    //rot?:FormalRotation
}
export interface TextOptions{
    size:number
    color:string
    font?: string,
    weight?: string,
    style?: string,
}
export interface TextTagIcon{
    id:number,
    name?:string,
    url?:string,
    width?:number
}

export interface Pattern{
    id: number
    name?: string
    width: number
    height: number
    grid?: {
        width: number
        color?: string
        opacity?: number
        horizontal?: boolean
        vertical?: boolean
        // rise：左下往右上，fall：左上往右下
        // arctan(0.5)约为27度，arctan(2)约为63度，你懂我的意思吧？
        rise27?: boolean
        rise45?: boolean
        rise63?: boolean
        fall27?: boolean
        fall45?: boolean
        fall63?: boolean
    }
}

/**
 * 线路片段的基接口。
 *
 * ## 端点语义约定
 * - `fromPt` 和 `toPt` 存储的是点ID，但**不代表唯一位置**
 * - 实际位置由 {@link resolveSliceEndpoints} 根据线路点序列解析
 * - 解析规则：
 *   1. fromIdx 必须 < toIdx（若用户选反，自动交换）
 *   2. from === to 的片段被禁止
 *   3. from 和 to 不能同时为奇异点（在线路中出现多次的点）
 *   4. 若一端为奇异点：非奇异端固定，奇异端按"最近"原则定向寻找
 *      - from 非奇异 → to（奇异）向右找最近的 from
 *      - to 非奇异 → from（奇异）向左找最近的 to
 *
 * ## 稳定性
 * 除"新增/去除奇异点"外，线路的普通编辑（插入/删除其他点）不会改变片段范围。
 *
 * @see resolveSliceEndpoints 完整解析逻辑
 */
export interface LineSliceBase {
    id: number
    line: number
    /** 起始点Id（解析规则见接口文档） */
    fromPt: number
    /** 结束点Id（解析规则见接口文档） */
    toPt: number
}

export interface StyleSlice extends LineSliceBase {
    style: number
}

export interface TimeSlice extends LineSliceBase {
    time: LineTimeInfo
}

/** Slice 种类标识 */
export type SliceKind = 'time' | 'style'

/** 任意一种 Slice 的联合类型 */
export type AnySlice = TimeSlice | StyleSlice

export interface DataSource{
    id: number
    name?: string
    url: string
    type: 'lineStyles'|'textTagIcons'|'patterns'|'colorSets'
    autoUpdate?: boolean
    overwriteSameName?: boolean
}

export interface SaveMetaData{
    lineStylesVersion?: number,
    textTagIconsVersion?: number,
    patternsVersion?: number,
    dataSourcesVersion?: number
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