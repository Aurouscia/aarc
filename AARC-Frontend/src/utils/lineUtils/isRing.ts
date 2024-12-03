import { FormalPt } from "@/models/coord";
import { ControlPoint, Line } from "@/models/save";
import { isSameCoord } from "../sgn";

function getPtIds(line:Line|number[]|ControlPoint[]){
    if('length' in line && line.length<=2)
        return []
    let ptIds:number[] = []
    if('name' in line){
        ptIds = line.pts
    }else if(typeof line[0] === 'number'){
        ptIds = line as number[]
    }else{
        ptIds = (line as ControlPoint[]).map(x=>x.id)
    }
    return ptIds
}
export function isRing(line:Line|number[]|ControlPoint[]){
    const ptIds = getPtIds(line)
    if(ptIds.length<=2)
        return
    return ptIds[0] === ptIds[ptIds.length-1]
}
export function isRingByFormalPts(formalPts:FormalPt[]){
    if(formalPts.length<=2)
        return
    const first = formalPts[0]
    const last = formalPts[formalPts.length-1]
    return isSameCoord(first.pos, last.pos)
}
export function getByIndexInRing(line:Line|number[], idx:number){
    const ptIds = getPtIds(line)
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
export function isSameIdxInLine(line:Line|number[], idxA:number, idxB:number){
    if(isRing(line)){
        const ptIds = getPtIds(line)
        const maxIdx = ptIds.length-1
        if(idxA === maxIdx)
            idxA = 0
        if(idxB === maxIdx)
            idxB = 0
    }
    return idxA === idxB
}