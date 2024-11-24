import { Line } from "@/models/save";

export function isRing(line:Line|number[]){
    let ptIds:number[] = []
    if('name' in line){
        ptIds = line.pts
    }else{
        ptIds = line
    }
    if(ptIds.length<=2)
        return
    return ptIds[0] === ptIds[ptIds.length-1]
}