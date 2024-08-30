import { Coord } from "@/models/coord";
import { clickLineThrs, clickLineThrs_sqrt2_sq, clickLineThrsSq } from "./consts";
import { isZero } from "./sgn";

export function coordOnLineOfFormalPts(c:Coord, pts:Coord[]){
    if(pts.length<=1)
        return false;
    for(let i=0;i<pts.length-1;i++){
        const a = pts[i]
        const b = pts[i+1]
        if(coordBetweenFormalPts(c, a, b))
            return true
    }
    return false
}
export function coordBetweenFormalPts(c:Coord, a:Coord, b:Coord){
    if(!coordBetweenBasicCheck(c,a,b))
        return false;
    const xDiff = a[0]-b[0]
    if(isZero(xDiff)){
        return (c[0]-a[0])**2 < clickLineThrsSq
    }
    const yDiff = a[1]-b[1]
    if(isZero(yDiff)){
        return (c[1]-a[1])**2 < clickLineThrsSq
    }
    if(xDiff * yDiff>0){
        //斜率为1
        const j = a[1]-a[0]
        return (c[1]-c[0]-j)**2 < clickLineThrs_sqrt2_sq
    }else{
        //斜率为-1
        const j = a[1]+a[0]
        return (c[1]+c[0]-j)**2 < clickLineThrs_sqrt2_sq
    }
}
function coordBetweenBasicCheck(c:Coord, a:Coord, b:Coord){
    let smallerX;
    let biggerX;
    if(a[0]>b[0]){
        smallerX = b[0]
        biggerX = a[0]
    }else{
        smallerX = a[0]
        biggerX = b[0]
    }
    if(c[0]<smallerX-clickLineThrs)
        return false
    if(c[0]>biggerX+clickLineThrs)
        return false
    let smallerY;
    let biggerY;
    if(a[1]>b[1]){
        smallerY = b[1]
        biggerY = a[1]
    }else{
        smallerY = a[1]
        biggerY = b[1]
    }
    if(c[1]<smallerY-clickLineThrs)
        return false
    if(c[1]>biggerY+clickLineThrs)
        return false
    return true
}