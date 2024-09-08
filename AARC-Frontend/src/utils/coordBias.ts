import { Coord, SgnCoord, SgnNumber } from "@/models/coord";
import { sqrt2half } from "./consts";

export function applyBias(a:Coord, bias:SgnCoord, dist:number):Coord{
    if(bias[0] != 0 && bias[1] != 0){
        dist*=sqrt2half
    }
    return [
        a[0] + bias[0] * dist,
        a[1] + bias[1] * dist
    ]
}
export function revBias(bias:SgnCoord):SgnCoord{
    return [-bias[0] as SgnNumber, -bias[1] as SgnNumber]
}