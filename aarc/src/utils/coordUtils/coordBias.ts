import { Coord, SgnCoord, SgnNumber } from "@/models/coord";
import { sqrt2half } from "../consts";

export function applyBias(a:Coord, bias:SgnCoord, dist:number):Coord{
    if(bias[0] != 0 && bias[1] != 0){
        dist*=sqrt2half
    }
    return [
        a[0] + bias[0] * dist,
        a[1] + bias[1] * dist
    ]
}

/**
 * 沿任意浮点方向向量 offset 一段距离。
 * 与 applyBias 不同：此处 way 应为已归一化的浮点方向，不对对角线做 sqrt2half 修正。
 */
export function applyBiasFree(a:Coord, way:Coord, dist:number):Coord{
    return [
        a[0] + way[0] * dist,
        a[1] + way[1] * dist
    ]
}

export function revBias(bias:SgnCoord):SgnCoord{
    return [-bias[0] as SgnNumber, -bias[1] as SgnNumber]
}