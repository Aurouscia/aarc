import { Coord } from "@/models/coord";
import { isZero } from "../sgn";
import { ControlPointDir } from "@/models/save";

export type PosRel = 's'|'l'|'llu'|'lu'|'luu'|'u'|'uur'|'ur'|'urr'
export function coordRel(a:Coord, b:Coord){
    const xDiff = a[0] - b[0]
    const yDiff = a[1] - b[1]
    return coordRelDiff(xDiff, yDiff)
}
export function coordRelDiff(xDiff:number, yDiff:number):{posRel:PosRel, rev:boolean}{
    if(isZero(xDiff)){
        if(isZero(yDiff))
            return {posRel:'s', rev:false}
        return {posRel:'u', rev:yDiff>0}
    }
    if(isZero(yDiff)){
        return {posRel:'l', rev:xDiff>0}
    }
    if(isZero(xDiff - yDiff)){
        return {posRel:'lu',rev:xDiff>0}
    }
    if(isZero(xDiff + yDiff)){
        return {posRel:'ur',rev:yDiff>0}
    }
    if((yDiff>0 && xDiff>yDiff) || (yDiff<0 && xDiff<yDiff)){
        return {posRel:'llu',rev:yDiff>0}
    }
    if((xDiff>0 && yDiff>xDiff) || (xDiff<0 && yDiff<xDiff)){
        return {posRel:'luu',rev:xDiff>0}
    }
    if((yDiff>0 && -xDiff<yDiff) || (yDiff<0 && xDiff<-yDiff)){
        return {posRel:'uur',rev:yDiff>0}
    }
    return {posRel:'urr',rev:xDiff<0}
}

export function coordRelDir(a:Coord, b:Coord):ControlPointDir{
    const xDiff = a[0] - b[0]
    const yDiff = a[1] - b[1]
    const xDiffZ = isZero(xDiff)
    const yDiffZ = isZero(yDiff)
    if(xDiffZ || yDiffZ)
        return ControlPointDir.vertical
    return ControlPointDir.incline
}