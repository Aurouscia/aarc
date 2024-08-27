import { numberCmpEpsilon } from "./consts";

export function sgn(num:number){
    if(isZero(num))
        return 0;
    return Math.sign(num);
}
export function isZero(num:number){
    return Math.abs(num) < numberCmpEpsilon
}