import { FormalRay, SgnCoord } from "@/models/coord";
import { isZero } from "@/utils/sgn";

export function rayParallel(a:FormalRay, b:FormalRay){
    return wayParallel(a.way, b.way)
}
export function rayPerpendicular(a:FormalRay, b:FormalRay){
    return wayPerpendicular(a.way, b.way)
}
export function raySameWay(a:FormalRay, b:FormalRay){
    return waySameWay(a.way, b.way)
}
export function rayRel(a:FormalRay, b:FormalRay){
    return wayRel(a.way, b.way)
}

export function wayParallel(a:SgnCoord, b:SgnCoord){
    const [a1, a2] = a;
    const [b1, b2] = b;
    return isZero(a1*b2 - a2*b1)
}
export function wayPerpendicular(a:SgnCoord, b:SgnCoord){
    const [a1, a2] = a;
    const [b1, b2] = b;
    return isZero(a1*b1 + a2*b2)
}
export function waySameWay(a:SgnCoord, b:SgnCoord){
    const [a1, a2] = a;
    const [b1, b2] = b;
    return a1===b1 && a2===b2
}
export function wayRel(a:SgnCoord, b:SgnCoord){
    if(wayParallel(a,b))
        return 'parallel'
    if(wayPerpendicular(a,b))
        return 'perpendicular'
    return 'others'
}