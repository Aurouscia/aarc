import { Coord } from "@/models/coord";
import { coordDist } from "../coordUtils/coordDist";

/**
 * 根据两点间的距离自动设置虚线属性，使得两端正好是dash实心部分，且长度尽量维持原状
 * @param pos0 起始点
 * @param pos1 终止点
 * @param dashSize 虚线长度
 * @param dashGap 虚线间隔
 */
export function autoDash(pos0:Coord, pos1:Coord, dashSize:number, dashGap:number):[number, number]{
    const dist = coordDist(pos0, pos1)
    if(dist<=dashSize)
        return [dashSize, dashGap]
    const distAndOneGap = dist + dashGap
    const dashCount = Math.round(distAndOneGap / (dashSize + dashGap))
    const actualLength = dashCount * (dashSize + dashGap)
    const sizeRatio = distAndOneGap / actualLength
    return [
        dashSize * sizeRatio,
        dashGap * sizeRatio
    ]
}