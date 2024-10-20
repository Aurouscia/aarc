import { Coord, FormalPt } from "@/models/coord";
import { isZero } from "../sgn";
import { ControlPointDir } from "@/models/save";

interface CoordOnLineJudgeConfig{
    readonly clickLineThrs: number,
    readonly clickLineThrsSq: number,
    readonly clickLineThrs_sqrt2_sq: number
}
export function coordOnLineOfFormalPts(c:Coord, pts:FormalPt[], config:CoordOnLineJudgeConfig){
    if(pts.length<=1)
        return false;
    for(let i=0;i<pts.length-1;i++){
        const a = pts[i]
        const b = pts[i+1]
        const betweenRes = coordBetweenFormalPts(c, a.pos, b.pos, config)
        if(betweenRes)
            return {
                aligned: betweenRes.aligned,
                afterPt: a.afterIdxEqv,
                dir: betweenRes.dir
            }
    }
    return false
}
function coordBetweenFormalPts(c:Coord, a:Coord, b:Coord, config:CoordOnLineJudgeConfig):{aligned:Coord, dir:ControlPointDir}|false{
    if(!coordBetweenBasicCheck(c,a,b, config))
        return false;
    const xDiff = a[0]-b[0]
    const yDiff = a[1]-b[1]
    let aligned:Coord|undefined = undefined;
    let dir:ControlPointDir = ControlPointDir.vertical
    if(isZero(xDiff)){
        if((c[0]-a[0])**2 < config.clickLineThrsSq)
            aligned = [a[0], c[1]]
    }
    else if(isZero(yDiff)){
        if((c[1]-a[1])**2 < config.clickLineThrsSq)
            aligned = [c[0], a[1]]
    }
    else if(xDiff * yDiff>0){
        //斜率为1
        const j = a[1]-a[0]
        if((c[1]-c[0]-j)**2 < config.clickLineThrs_sqrt2_sq){
            const os = (c[1]-c[0]-j)/2
            aligned = [c[0]+os, c[1]-os]
            dir = ControlPointDir.incline
        }
    }else{
        //斜率为-1
        const j = a[1]+a[0]
        if((c[1]+c[0]-j)**2 < config.clickLineThrs_sqrt2_sq){
            const os = (c[1]+c[0]-j)/2
            aligned = [c[0]-os, c[1]-os]
            dir = ControlPointDir.incline
        }
    }
    if(aligned)
        return{
            aligned,
            dir
        }
    return false
}
function coordBetweenBasicCheck(c:Coord, a:Coord, b:Coord, config: CoordOnLineJudgeConfig){
    let smallerX;
    let biggerX;
    if(a[0]>b[0]){
        smallerX = b[0]
        biggerX = a[0]
    }else{
        smallerX = a[0]
        biggerX = b[0]
    }
    if(c[0]<smallerX-config.clickLineThrs)
        return false
    if(c[0]>biggerX+config.clickLineThrs)
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
    if(c[1]<smallerY-config.clickLineThrs)
        return false
    if(c[1]>biggerY+config.clickLineThrs)
        return false
    return true
}