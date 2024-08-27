import { Coord } from "@/models/coord";

export function coordDistSq(a:Coord, b:Coord){
    const diffX = a[0] - b[0]
    const diffY = a[1] - b[1]
    return diffX**2 + diffY**2 
}
export function coordDist(a:Coord, b:Coord){
    return Math.sqrt(coordDistSq(a,b))
}