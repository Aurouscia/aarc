import { Coord } from "@/models/coord";
import { coordDist } from "./coordDist";

export function coordInterpRange(coord:Coord[], maxDist:number){
    const res:Coord[] = []
    for(let i=0;i<coord.length-1;i++){
        const a = coord[i]
        const b = coord[i+1]
        if(i==0)
            res.push(a)
        const interped = coordInterp(a, b, maxDist)
        res.push(...interped)
        res.push(b)
    }
    return res
}
export function coordInterp(a:Coord, b:Coord, maxDist:number){
    const dist = coordDist(a, b);
    const count = Math.ceil(dist/maxDist);
    if(count < 1)
        return [];
    const xDiffUnit = (b[0] - a[0])/count
    const yDiffUnit = (b[1] - a[1])/count
    const res:Coord[] = []
    for(let i=1;i<count;i++){
        res.push([a[0]+xDiffUnit*i, a[1]+yDiffUnit*i])
    }
    return res;
}