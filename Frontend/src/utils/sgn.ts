import { numberCmpEpsilon } from "./consts";

export function sgn(num:number){
    if(Math.abs(num) < numberCmpEpsilon)
        return 0;
    return Math.sign(num);
}