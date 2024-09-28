import { Coord } from "@/models/coord";

export function coordAdd(a:Coord, b:Coord):Coord{
    return [a[0]+b[0], a[1]+b[1]]
}
export function coordSub(a:Coord, b:Coord):Coord{
    return [a[0]-b[0], a[1]-b[1]]
}