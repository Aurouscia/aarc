import { Coord, FormalRay, twinPts2Ray, twinPts2SgnCoord, wayAngle } from "@/models/coord";
import { rayRel } from "../rayUtils/rayParallel";
import { rayAfterRotate90 } from "../rayUtils/rayRotate";
import { rayIntersect } from "../rayUtils/rayIntersection";
import { coordDist } from "../coordUtils/coordDist";
import { coordCrossProduct } from "../coordUtils/coordMath";
import { CvsContext } from "@/models/cvs/common/cvsContext";

export function drawArcByThreePoints(ctx:CvsContext, a:Coord, b:Coord, c:Coord){
    const ray0 = twinPts2Ray(a, b)
    const ray1 = twinPts2Ray(b, c)
    ray1.source = c
    return drawArcByTwoRays(ctx, ray0, ray1)
}

export function drawArcByTwoRays(ctx:CvsContext, a:FormalRay, b:FormalRay, radius?:number){
    const rel = rayRel(a, b)
    if(rel==='parallel'){
        ctx.lineTo(...b.source)
        return
    }
    const ap = rayAfterRotate90(a)
    const bp = rayAfterRotate90(b)
    const center = rayIntersect(ap, bp)
    if(!center){
        ctx.lineTo(...b.source)
        return
    }
    if(!radius){
        radius = coordDist(a.source, center)
    }
    const counterClockwise = coordCrossProduct(a.way, b.way) < 0
    const startAngle = wayAngle(twinPts2SgnCoord(center, a.source))
    const endAngle = wayAngle(twinPts2SgnCoord(center, b.source))
    ctx.arc(...center, radius, startAngle, endAngle, counterClockwise)
}