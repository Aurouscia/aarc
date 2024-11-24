import { Line } from "@/models/save";

export function ptInLineIndices(ptId:number, line:Line){
    const indices:number[] = []
    line.pts.forEach((pt, idx)=>{
        if(pt===ptId)
            indices.push(idx)
    })
    return indices
}