import { Coord } from "@/models/coord";
import { numberRoundEpsilon as eps } from "../consts";

const epsInv = Math.round(1/eps)

export function coordRound(coord: Coord) {
    coord[0] = Math.floor(coord[0] * epsInv) / epsInv;
    coord[1] = Math.floor(coord[1] * epsInv) / epsInv;
}