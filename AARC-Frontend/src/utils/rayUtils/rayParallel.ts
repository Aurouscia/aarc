import { FormalRay, SgnCoord } from "@/models/coord";
import { isZero } from "@/utils/sgn";
import { coordCrossProduct, coordDotProduct } from "../coordUtils/coordMath";

export function rayParallel(a:FormalRay, b:FormalRay){
    return wayParallel(a.way, b.way)
}
export function rayPerpendicular(a:FormalRay, b:FormalRay){
    return wayPerpendicular(a.way, b.way)
}
export function raySameWay(a:FormalRay, b:FormalRay){
    return waySameWay(a.way, b.way)
}
export function rayRel(a:FormalRay, b:FormalRay, inverted?:boolean){
    return wayRel(a.way, b.way, inverted)
}

export function wayParallel(a:SgnCoord, b:SgnCoord){
    return isZero(coordCrossProduct(a, b))
}
export function wayPerpendicular(a:SgnCoord, b:SgnCoord){
    return isZero(coordDotProduct(a, b))
}
export function waySameWay(a:SgnCoord, b:SgnCoord){
    const [a1, a2] = a;
    const [b1, b2] = b;
    return a1===b1 && a2===b2
}

export type WayRel = 'parallel'|'90'|'45'|'135'
export function wayRel(a:SgnCoord, b:SgnCoord, inverted?:boolean):WayRel{
    if(wayParallel(a,b))
        return 'parallel'
    const dot = coordDotProduct(a,b)
    if(isZero(dot))
        return '90'
    let close = dot > 0
    if(inverted)
        close = !close
    if(dot > 0)
        return '45'
    return '135'
}