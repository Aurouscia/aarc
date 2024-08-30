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
    const diffXSq = (a[0] - b[0])**2
    if(diffXSq > cmp)
        return false;
    const diffYSq = (a[1] - b[1])**2
    return (diffXSq + diffYSq) < cmp
}