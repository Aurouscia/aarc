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

/** 计算旋转后的轴对齐包围盒(AABB) */
export function getRotatedAABB(rect:RectCoord, angleDeg:number, anchor:Coord):RectCoord{
    const angle = angleDeg * Math.PI / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const [ax, ay] = anchor
    
    // 原始矩形的四个角
    const corners:Coord[] = [
        [rect[0][0], rect[0][1]], // 左上
        [rect[1][0], rect[0][1]], // 右上
        [rect[1][0], rect[1][1]], // 右下
        [rect[0][0], rect[1][1]]  // 左下
    ]
    
    // 旋转每个角点
    const rotated = corners.map(([x, y]) => {
        const dx = x - ax
        const dy = y - ay
        return [
            ax + dx * cos - dy * sin,
            ay + dx * sin + dy * cos
        ] as Coord
    })
    
    // 计算新的AABB
    const xs = rotated.map(p => p[0])
    const ys = rotated.map(p => p[1])
    return [
        [Math.min(...xs), Math.min(...ys)],
        [Math.max(...xs), Math.max(...ys)]
    ] as RectCoord
}