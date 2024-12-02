import { coordCrossProduct } from "@/utils/coordUtils/coordMath"
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
        return coordCrossProduct(waySelector(a), waySelector(b))
    })
}