import { Save } from "@/models/save"

export const minCvsSide = 500
export function ensureValidCvsSize(save:Save){
    if(save.cvsSize[0] < minCvsSide)
        save.cvsSize[0] = minCvsSide
    if(save.cvsSize[1] < minCvsSide)
        save.cvsSize[1] = minCvsSide
}