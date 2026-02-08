import { Coord, SgnCoord, SgnNumber } from "@/models/coord";
import { numberCmpEpsilon } from "./consts";

export function sgn(num:number):SgnNumber{
    if(isZero(num))
        return 0;
    return Math.sign(num) as 1|-1;
}
export function sgnCoord(coord:Coord):SgnCoord{
    return [sgn(coord[0]), sgn(coord[1])]
}
export function isZero(num:number){
    return Math.abs(num) < numberCmpEpsilon
}
export function isSameCoord(a:Coord, b:Coord){
    return isZero(a[0]-b[0]) && isZero(a[1]-b[1])
}
export function lessThanOrEqualTo(a:number, b:number){
    return a < b + numberCmpEpsilon
}