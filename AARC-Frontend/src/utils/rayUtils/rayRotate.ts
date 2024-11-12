import { FormalRay, SgnNumber } from "@/models/coord";

// 0 -1
// 1  0
export function rayRotate90(ray:FormalRay){
    const [r1, r2] = ray.way
    ray.way[0] = -r2 as SgnNumber
    ray.way[1] = r1 as SgnNumber
}