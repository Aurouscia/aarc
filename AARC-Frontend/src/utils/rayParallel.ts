import { FormalRay } from "@/models/coord";
import { isZero } from "./sgn";

export function rayParallel(a:FormalRay, b:FormalRay){
    const [a1, a2] = a.way;
    const [b1, b2] = b.way;
    return isZero(a1*b2 - a2*b1)
}