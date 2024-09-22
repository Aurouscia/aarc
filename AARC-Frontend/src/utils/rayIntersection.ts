import { Coord, FormalRay } from "@/models/coord";
import { rayToCoordDist } from "./rayToCoordDist";
import { sqrt2, sqrt2half } from "./consts";
import { isZero } from "./sgn";

export function findIntersect(a:FormalRay, b:FormalRay, seedOnA:Coord){
    const dist = rayToCoordDist(b, seedOnA)
    const aIncline = a.way[0] * a.way[1] !== 0
    const bIncline = b.way[0] * b.way[1] !== 0
    if(aIncline)
    {
        a.way[0] *= sqrt2half
        a.way[1] *= sqrt2half
    }
    let ratio = 1
    if(aIncline !== bIncline){
        ratio = sqrt2
    }
    const res:Coord = [...seedOnA]
    const xOffset = a.way[0]*dist*ratio;
    const yOffset = a.way[1]*dist*ratio;
    res[0] += xOffset
    res[1] += yOffset
    if(isZero(rayToCoordDist(b, res)))
        return res;
    else{
        res[0] -= 2*xOffset
        res[1] -= 2*yOffset
        return res;
    }
}