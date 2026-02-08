import { FormalRay, SgnNumber } from "@/models/coord";

// 0 -1
// 1  0
export function rayRotate90(ray:FormalRay){
    const [r1, r2] = ray.way
    ray.way[0] = -r2 as SgnNumber
    ray.way[1] = r1 as SgnNumber
}
export function rayAfterRotate90(ray:FormalRay):FormalRay{
    const [r1, r2] = ray.way
    const x = -r2 as SgnNumber
    const y = r1 as SgnNumber
    return {source:[...ray.source], way:[x, y]}
}
export function rayAfterRotate180(ray:FormalRay):FormalRay{
    const [r1, r2] = ray.way
    const x = -r1 as SgnNumber
    const y = -r2 as SgnNumber
    return {source:[...ray.source], way:[x, y]}
}