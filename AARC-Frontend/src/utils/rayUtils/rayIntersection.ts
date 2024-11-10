import { Coord, FormalRay } from "@/models/coord";
import { rayToCoordDist } from "./rayToCoordDist";
import { sqrt2, sqrt2half } from "@/utils/consts";
import { isZero } from "@/utils/sgn";
import { rayParallel } from "./rayParallel";

export function rayIntersect(a:FormalRay, b:FormalRay, seedOnA?:Coord){
    if(rayParallel(a, b)){
        return
    }
    if(!seedOnA){
        seedOnA = a.source
    }
    let [ax, ay] = a.way;
    let [bx, by] = b.way;
    const dist = rayToCoordDist(b, seedOnA)
    const aIncline = ax * ay != 0
    const bIncline = bx * by != 0
    if(aIncline)
    {
        ax *= sqrt2half
        ay *= sqrt2half
    }
    let ratio = 1
    if(aIncline !== bIncline){
        ratio = sqrt2
    }
    const res:Coord = [...seedOnA]
    const xOffset = ax*dist*ratio;
    const yOffset = ay*dist*ratio;
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