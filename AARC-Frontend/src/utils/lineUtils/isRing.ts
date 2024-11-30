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
export function getByIndexInRing(line:Line|number[], idx:number){
    let ptIds:number[] = []
    if('name' in line){
        ptIds = line.pts
    }else{
        ptIds = line
    }
    const maxIdx = ptIds.length-1
    if(idx>=0 && idx<=maxIdx){
        return ptIds[idx]
    }else if(idx<0){
        const diff = 0 - idx
        if(diff < ptIds.length-1){
            return ptIds[ptIds.length - diff - 1]
        }
    }else{
        const diff = idx - maxIdx
        if(diff < ptIds.length-1){
            return ptIds[diff]
        }
    }
}