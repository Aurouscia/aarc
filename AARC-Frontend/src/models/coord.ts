import { sgn } from "@/utils/sgn"

export type Coord = [number, number]

export type RectCoord = [Coord, Coord]

export type SgnNumber = -1 | 0 | 1
export type SgnCoord = [SgnNumber, SgnNumber]

// x--x-----x-----x--x   pts
// 0--1-----2-----3--4   ptIdx
// x--x-x-x-x--x--x--x   formalPts
// 0--1-1-1-2--2--3--4   afterIdxEqv
export interface FormalPt{
    pos:Coord,
    afterIdxEqv:number
}

export interface FormalRay{
    source:Coord,
    way:SgnCoord
}

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
export function twinPts2Ray(from:Coord, to:Coord):FormalRay{
    const way:SgnCoord = [sgn(to[0]-from[0]),sgn(to[1]-from[1])]
    return{source:from, way}
}
export function twinPts2SgnCoord(from:Coord, to:Coord):SgnCoord{
    const way:SgnCoord = [sgn(to[0]-from[0]),sgn(to[1]-from[1])]
    return way
}
export function waySame(way0:SgnCoord, way1:SgnCoord){
    return way0[0] == way1[0] && way0[1] == way1[1]
}
export function waysSort<T>(items:T[], waySelector:(item:T)=>SgnCoord){
    items.sort((a,b)=>{
        const aWay = waySelector(a)
        const bWay = waySelector(b)
        return wayClockwiseIdx(aWay) - wayClockwiseIdx(bWay)
    })
}
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
export function wayAngle(way:SgnCoord):number{
    const idx = wayClockwiseIdx(way)
    return (idx - 2) * Math.PI / 4
}