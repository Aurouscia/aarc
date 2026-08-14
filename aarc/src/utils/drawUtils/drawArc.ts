import { Coord, FormalRay, FreeRay, twinPts2Ray, twinPts2SgnCoord, wayAngle } from "@/models/coord";
import { rayRel } from "../rayUtils/rayParallel";
import { rayAfterRotate90, rayAfterRotate90Free } from "../rayUtils/rayRotate";
import { rayIntersect } from "../rayUtils/rayIntersection";
import { coordDist } from "../coordUtils/coordDist";
import { coordCrossProduct, coordSub, makeCoordLength1 } from "../coordUtils/coordMath";
import { CvsContext } from "@/models/cvs/common/cvsContext";
import { isZero } from "@/utils/sgn";

export function drawArcByThreePoints(
    ctx:CvsContext,
    a:Coord,
    b:Coord,
    c:Coord,
    mode:'formal'|'free' = 'formal'
){
    if(mode === 'free'){
        const ray0:FreeRay = {source:a, way:makeCoordLength1([b[0]-a[0], b[1]-a[1]])}
        const ray1:FreeRay = {source:c, way:makeCoordLength1([c[0]-b[0], c[1]-b[1]])}
        return drawArcByFreeRays(ctx, ray0, ray1)
    }
    const ray0 = twinPts2Ray(a, b)
    const ray1 = twinPts2Ray(b, c)
    ray1.source = c
    return drawArcByFormalRays(ctx, ray0, ray1)
}

export function drawArcByFormalRays(ctx:CvsContext, a:FormalRay, b:FormalRay, radius?:number){
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

export function drawArcByFreeRays(ctx:CvsContext, a:FreeRay, b:FreeRay, radius?:number){
    const au = makeCoordLength1(a.way)
    const bu = makeCoordLength1(b.way)
    const cross = coordCrossProduct(au, bu)
    if(isZero(cross)){
        ctx.lineTo(...b.source)
        return
    }
    // 分别沿 a、b 的方向旋转 90° 得到垂线方向，交点即为圆心
    const na = rayAfterRotate90Free({source:a.source, way:au}).way
    const nb = rayAfterRotate90Free({source:b.source, way:bu}).way
    // 解 a.source + s*na = b.source + t*nb
    const denom = coordCrossProduct(na, nb)
    if(isZero(denom)){
        ctx.lineTo(...b.source)
        return
    }
    const s = coordCrossProduct(coordSub(b.source, a.source), nb) / denom
    const center: Coord = [a.source[0] + s * na[0], a.source[1] + s * na[1]]
    if(!radius){
        radius = coordDist(a.source, center)
    }
    const startAngle = Math.atan2(a.source[1] - center[1], a.source[0] - center[0])
    const endAngle = Math.atan2(b.source[1] - center[1], b.source[0] - center[0])
    let delta = endAngle - startAngle
    while(delta <= -Math.PI) delta += 2 * Math.PI
    while(delta > Math.PI) delta -= 2 * Math.PI
    const counterClockwise = delta < 0
    ctx.arc(...center, radius, startAngle, endAngle, counterClockwise)
}
