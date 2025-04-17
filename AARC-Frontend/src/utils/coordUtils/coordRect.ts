import { Coord, RectCoord } from "@/models/coord";

export function rectInside(rect:RectCoord, pos:Coord){
    const [x, y] = pos;
    const [[leftX, upperY], [rightX, lowerY]] = rect;
    return x >= leftX && x <= rightX && y <= lowerY && y >= upperY 
}

export function enlargeRect(rect:RectCoord, delta:number){
    const [[leftX, upperY], [rightX, lowerY]] = rect;
    return [[leftX-delta, upperY-delta], [rightX+delta, lowerY+delta]] as RectCoord; 
}