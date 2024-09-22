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