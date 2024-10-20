import { Coord, FormalRay } from "@/models/coord";
import { sqrt2half } from "@/utils/consts";

export function rayToCoordDist(ray:FormalRay, coord:Coord){
    const xDiff = ray.source[0] - coord[0]
    const yDiff = ray.source[1] - coord[1]
    if(ray.way[0]==0)
        return Math.abs(xDiff)
    if(ray.way[1]==0)
        return Math.abs(yDiff)
    if(ray.way[0]*ray.way[1]>0)
        return Math.abs(yDiff-xDiff)*sqrt2half
    else
        return Math.abs(yDiff+xDiff)*sqrt2half
}