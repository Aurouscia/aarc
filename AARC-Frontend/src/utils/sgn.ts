import { Coord } from "@/models/coord";
import { numberCmpEpsilon } from "./consts";

export function sgn(num:number){
    if(isZero(num))
        return 0;
    return Math.sign(num);
}
export function isZero(num:number){
    return Math.abs(num) < numberCmpEpsilon
}
export function isSameCoord(a:Coord, b:Coord){
    return isZero(a[0]-b[0]) && isZero(a[1]-b[1])
}