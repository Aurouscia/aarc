import { FormalRay, FreeRay, SgnNumber } from "@/models/coord";

// 旋转 90° 的变换矩阵：
//  0 -1
//  1  0
// 该矩阵对 FormalRay（8 方向量化方向）和 FreeRay（浮点方向）均适用，
// 因为公式都是 [x, y] -> [-y, x]。

/** 将 FormalRay 的方向向量原地旋转 90°（顺时针/逆时针取决于坐标系） */
export function rayRotate90(ray:FormalRay){
    const [r1, r2] = ray.way
    ray.way[0] = -r2 as SgnNumber
    ray.way[1] = r1 as SgnNumber
}

/** 返回一条新的 FormalRay，其方向向量相对原射线旋转 90° */
export function rayAfterRotate90(ray:FormalRay):FormalRay{
    const [r1, r2] = ray.way
    const x = -r2 as SgnNumber
    const y = r1 as SgnNumber
    return {source:[...ray.source], way:[x, y]}
}

/** 返回一条新的 FormalRay，其方向向量相对原射线旋转 180° */
export function rayAfterRotate180(ray:FormalRay):FormalRay{
    const [r1, r2] = ray.way
    const x = -r1 as SgnNumber
    const y = -r2 as SgnNumber
    return {source:[...ray.source], way:[x, y]}
}

/** 返回一条新的 FreeRay，其浮点方向向量相对原射线旋转 90°。
 *  数学上与 FormalRay 版本一致，但保留浮点精度，用于自由点任意角度圆角。
 */
export function rayAfterRotate90Free(ray:FreeRay):FreeRay{
    const [r1, r2] = ray.way
    return {source:[...ray.source], way:[-r2, r1]}
}

/** 返回一条新的 FreeRay，其浮点方向向量相对原射线旋转 180° */
export function rayAfterRotate180Free(ray:FreeRay):FreeRay{
    const [r1, r2] = ray.way
    return {source:[...ray.source], way:[-r1, -r2]}
}
