export type Coord = [number, number]

// x--x-----x-----x--x   pts
// 0--1-----2-----3--4   ptIdx
// x--x-x-x-x--x--x--x   formalPts
// 0--1-1-1-2--2--3--4   afterIdxEqv
export interface FormalPt{
    pos:Coord,
    afterIdxEqv:number
}