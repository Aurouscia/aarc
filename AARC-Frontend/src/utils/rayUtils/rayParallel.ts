import { FormalRay } from "@/models/coord";
import { isZero } from "@/utils/sgn";

export function rayParallel(a:FormalRay, b:FormalRay){
    const [a1, a2] = a.way;
    const [b1, b2] = b.way;
    return isZero(a1*b2 - a2*b1)
}
export function rayPerpendicular(a:FormalRay, b:FormalRay){
    const [a1, a2] = a.way;
    const [b1, b2] = b.way;
    return isZero(a1*b1 + a2*b2)
}
export function raySameWay(a:FormalRay, b:FormalRay){
    console.log(a.way,b.way)
    const [a1, a2] = a.way;
    const [b1, b2] = b.way;
    return a1===b1 && a2===b2
}