import { Coord } from "@/models/coord";
import { sqrt2half } from "./consts";

export type XBias = -1|0|1
export type YBias = -1|0|1
export type Bias = {x:XBias,y:YBias}
export function applyBias(a:Coord, bias:Bias, dist:number):Coord{
    if(bias.x != 0 && bias.y != 0){
        dist*=sqrt2half
    }
    return [
        a[0] + bias.x * dist,
        a[1] + bias.y * dist
    ]
}
export function revBias(bias:Bias):Bias{
    return {
        x: -bias.x as XBias,
        y: -bias.y as YBias
    }
}