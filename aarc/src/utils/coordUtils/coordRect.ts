import { Coord, RectCoord } from "@/models/coord";

/** 判断点是否在矩形内部 */
export function rectInside(rect:RectCoord, pos:Coord){
    const [x, y] = pos;
    const [[leftX, upperY], [rightX, lowerY]] = rect;
    return x >= leftX && x <= rightX && y <= lowerY && y >= upperY 
}

/** 向四个方向扩大矩形 */
export function enlargeRect(rect:RectCoord, delta:number){
    const [[leftX, upperY], [rightX, lowerY]] = rect;
    return [[leftX-delta, upperY-delta], [rightX+delta, lowerY+delta]] as RectCoord; 
}

/** 向四个方向扩大矩形（按比例） */
export function enlargeRectBy(rect:RectCoord, pct:number){
    const [[leftX, upperY], [rightX, lowerY]] = rect;
    const deltaX = (rightX-leftX)*pct;
    const deltaY = (lowerY-upperY)*pct;
    return [[leftX-deltaX, upperY-deltaY], [rightX+deltaX, lowerY+deltaY]] as RectCoord;
}

/** 判断“矩形和点的距离的平方”是否小于指定值 */
export function rectCoordDistSqLessThan(rect:RectCoord, pos:Coord, cmpSq:number){
    const [x, y] = pos;
    const [[leftX, upperY], [rightX, lowerY]] = rect;
    
    // 如果点在矩形内部，距离为0
    if (x >= leftX && x <= rightX && y >= upperY && y <= lowerY) {
        return true;
    }
    
    // 计算点到矩形最近边的距离
    let closestX, closestY;
    
    // 找到最近的X坐标
    if (x < leftX) {
        closestX = leftX;
    } else if (x > rightX) {
        closestX = rightX;
    } else {
        closestX = x; // 点在矩形的X范围内
    }
    
    // 提前计算x差的平方，如果已经大于cmpSq则直接返回false
    const xDiffSq = (x - closestX) ** 2;
    if (xDiffSq > cmpSq) {
        return false;
    }
    
    // 找到最近的Y坐标
    if (y < upperY) {
        closestY = upperY;
    } else if (y > lowerY) {
        closestY = lowerY;
    } else {
        closestY = y; // 点在矩形的Y范围内
    }
    
    // 计算y差的平方并加上x差的平方
    const yDiffSq = (y - closestY) ** 2;
    const distSq = xDiffSq + yDiffSq;
    return distSq < cmpSq;
}