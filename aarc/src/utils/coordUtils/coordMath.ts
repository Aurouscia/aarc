import { Coord, SgnCoord } from "@/models/coord";
import { sgnCoord } from "../sgn";

export function coordAdd(a:Coord, b:Coord):Coord{
    return [a[0]+b[0], a[1]+b[1]]
}
export function coordSub(a:Coord, b:Coord):Coord{
    return [a[0]-b[0], a[1]-b[1]]
}
export function coordSubSgn(a:Coord, b:Coord):SgnCoord{
    return sgnCoord(coordSub(a, b))
}
export function coordTo0DistSq(a:Coord):number{
    return a[0]**2 + a[1]**2
}
export function coordTo0Dist(a:Coord):number{
    return Math.sqrt(coordTo0DistSq(a))
}
export function coordMut(a:Coord, c:number):Coord{
    return [a[0]*c, a[1]*c]
}
export function coordAvg(a:Coord, b:Coord):Coord{
    return coordMut(coordAdd(a, b), 0.5)
}
export function coordCrossProduct(a:Coord, b:Coord):number{
    return a[0]*b[1] - a[1]*b[0]
}
export function coordDotProduct(a:Coord, b:Coord):number{
    return a[0]*b[0] + a[1]*b[1]
}
export function coordAngle(a:Coord, b:Coord):number{
    const prod = coordDotProduct(a, b)
    const aLength = coordTo0Dist(a)
    const bLength = coordTo0Dist(b)
    const arcCosParam = prod / (aLength * bLength)
    return Math.acos(arcCosParam)
}

export function coordTwinShrink(fixed:Coord, move:Coord, by:number){
    const diff = coordSub(fixed, move)
    const diffLength = Math.sqrt(coordTo0DistSq(diff))
    const diffModified = coordMut(diff, by/diffLength)
    return coordAdd(move, diffModified)
}
export function coordTwinExtend(head:Coord, afterHead:Coord, by:number){
    const diff = coordSub(head, afterHead)
    const diffLength = Math.sqrt(coordTo0DistSq(diff))
    const adjusted = coordMut(diff, by/diffLength)
    return coordAdd(head, adjusted)
}