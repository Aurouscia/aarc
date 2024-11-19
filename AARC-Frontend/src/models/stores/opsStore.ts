import { defineStore } from "pinia"
import { ref } from "vue"
import { Coord } from "../coord"

export type OpsAt = 'lt'|'lb'|'rt'|'rb'
export type OpsBtnType = 'addPt'|'rmPt'|'addPtTL'|'rmPtFL'|'swPtDir'|'swPtSta'
export interface OpsBtn{
    type:OpsBtnType,
    cb:()=>void,
    color?:string
}
export const useOpsStore = defineStore('ops', ()=>{
    const show = ref<boolean>()
    const clientPos = ref<Coord>([0,0])
    const at = ref<OpsAt>('rb')
    const btns = ref<OpsBtn[][]>()
    return { show, clientPos, at, btns }
})