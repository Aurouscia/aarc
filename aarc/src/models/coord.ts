import { sgn } from "@/utils/sgn"

/** 平面坐标，通常为 canvas 逻辑坐标 */
export type Coord = [number, number]

/** 矩形对角坐标对 */
export type RectCoord = [Coord, Coord]

/** 带符号整数 -1 / 0 / 1，用于表示网格方向的量化分量 */
export type SgnNumber = -1 | 0 | 1

/** 8 方向网格方向向量，每个分量仅为 -1 / 0 / 1 */
export type SgnCoord = [SgnNumber, SgnNumber]

// x--x-----x-----x--x   pts
// 0--1-----2-----3--4   ptIdx
// x--x-x-x-x--x--x--x   formalPts
// 0--1-1-1-2--2--3--4   afterIdxEqv

/** 规范化后的线路点。
 *  - pos: 实际坐标
 *  - afterIdxEqv: 该点对应的原控制点索引（插值点取前一个控制点索引）
 *  - free: 若该点对应原控制点且为自由点，标记为 true
 */
export interface FormalPt{
    pos:Coord,
    afterIdxEqv:number
    /** 若该 formal 点对应原控制点且该控制点是自由点，标记为 true */
    free?:boolean
}

/** 基于 8 方向网格方向的有向射线，way 为量化后的 SgnCoord */
export interface FormalRay{
    source:Coord,
    way:SgnCoord
}

/** 基于浮点方向向量的有向射线，用于自由点带来的任意角度圆角。
 *  - source: 射线起点
 *  - way: 任意非零方向向量，使用处通常会先归一化
 */
export interface FreeRay{
    source:Coord,
    way:Coord
}

/** 将 8 方向网格方向向量折叠为更粗的方向类别 */
export function collapseWay(way?:SgnCoord):'vert'|'hori'|'rise'|'fall'|'none'{
    if(!way)
        return 'none'
    const [x, y] = way
    if(x === 0){
        if(y === 0){
            return 'none'
        }else{
            return 'vert'
        }
    }else if(y === 0){
        return 'hori'
    }
    else if(x === y){
        return 'fall'
    }else{
        return 'rise'
    }
}

/** 由两点构造一条 FormalRay，方向按 sgn 量化到 8 方向 */
export function twinPts2Ray(from:Coord, to:Coord):FormalRay{
    const way:SgnCoord = [sgn(to[0]-from[0]),sgn(to[1]-from[1])]
    return{source:from, way}
}

/** 由两点构造一个 SgnCoord 方向向量 */
export function twinPts2SgnCoord(from:Coord, to:Coord):SgnCoord{
    const way:SgnCoord = [sgn(to[0]-from[0]),sgn(to[1]-from[1])]
    return way
}

/** 判断两个 8 方向向量是否相同 */
export function waySame(way0:SgnCoord, way1:SgnCoord){
    return way0[0] == way1[0] && way0[1] == way1[1]
}

/** 按 8 方向的顺时针索引对元素进行排序 */
export function waysSort<T>(items:T[], waySelector:(item:T)=>SgnCoord){
    items.sort((a,b)=>{
        const aWay = waySelector(a)
        const bWay = waySelector(b)
        return wayClockwiseIdx(aWay) - wayClockwiseIdx(bWay)
    })
}

/** 获取 8 方向向量在顺时针方向上的索引，用于角度排序。
 *  索引布局对应 8 方向键盘区：
 *  // 7 0 1
 *  // 6   2
 *  // 5 4 3
 */
export function wayClockwiseIdx(way:SgnCoord):number{
    // 7 0 1
    // 6   2
    // 5 4 3
    const [x,y] = way
    if(x===0){
        if(y===1)
            return 4
        else
            return 0
    }
    if(x===1){
        if(y===-1)
            return 1
        if(y===0)
            return 2
        return 3 
    }
    else{
        if(y===1)
            return 5
        if(y===0)
            return 6
        return 7
    }
}

/** 将 8 方向向量转换为其在 canvas 坐标系中的角度（弧度）。
 *  例如：向右为 0，向下为 π/2，向左为 π，向上为 -π/2。
 */
export function wayAngle(way:SgnCoord):number{
    const idx = wayClockwiseIdx(way)
    return (idx - 2) * Math.PI / 4
}
