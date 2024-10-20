import { Coord, RectCoord } from "@/models/coord";

export function rectInside(rect:RectCoord, pos:Coord){
    const [x, y] = pos;
    const [[leftX, upperY], [rightX, lowerY]] = rect;
    return x >= leftX && x <= rightX && y <= lowerY && y >= upperY 
}