import { Line } from "@/models/save";

/**
 * 给定一组线路，返回它们是否为一个家庭（一个主线/一个主线及其支线/同一主线下的支线）
 * @param lines 
 * @returns 
 */
export function isLineFamily(lines:Line[]){
    if(lines.length<=1)
        return true
    let onlyId:number = -1
    for(const l of lines){
        //若l.parent为falsy(0或undefined)则使用l.id
        const realId = l.parent || l.id
        if(onlyId === -1){
            onlyId = realId
        }
        else if(onlyId !== realId){
            return false
        }
    }
    return true
}