import { Coord } from "@/models/coord";

export function coordDistSq(a:Coord, b:Coord){
    const diffX = a[0] - b[0]
    const diffY = a[1] - b[1]
    return diffX**2 + diffY**2 
}
export function coordDist(a:Coord, b:Coord){
    return Math.sqrt(coordDistSq(a,b))
}
export function coordDistSqLessThan(a:Coord, b:Coord, cmp:number){
    const xDiff = a[0] - b[0]
    const diffXSq = (xDiff)**2
    if(diffXSq > cmp)
        return false;
    const yDiff = a[1] - b[1]
    const diffYSq = (yDiff)**2
    if((diffXSq + diffYSq) < cmp){
        return {diffXSq, diffYSq}
    }
    return false
}
export function coordDistSqWithThrs(a:Coord, b:Coord, thrs:number){
    const diffXSq = (a[0] - b[0])**2
    if(diffXSq > thrs)
        return false;
    const diffYSq = (a[1] - b[1])**2
    const res = diffXSq + diffYSq
    if(res < thrs)
        return res
    return false
}