import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { Coord, SgnCoord, waySame } from "../coord"

export type OpsAt = 'lt'|'lb'|'rt'|'rb'|'l'|'r'|'t'|'b'
export type OpsBtnType = 'addPt'|'rmPt'|'addPtTL'|'rmPtFL'|'swPtDir'|'swPtSta'
export interface OpsBtn{
    type:OpsBtnType,
    cb:()=>void,
    color?:string,
    text:string,
    textSub?:string
}
export const useOpsStore = defineStore('ops', ()=>{
    const clientPos = ref<Coord>()
    const btns = ref<OpsBtn[][]>()
    const atAvoidWays = ref<SgnCoord[]>([])
    const atAvoidAts = computed<OpsAt[]>(()=>{
        return atAvoidWays.value.map(w=>way2at(w))
    })
    const at = computed<OpsAt>(()=>{
        const avd = atAvoidAts.value
        const tryScores = tryOrder.map(tryAt=>{
            const adjs = getAdjacentAts(tryAt)
            let score = 0
            if(avd.includes(tryAt))
                score+=10
            if(avd.includes(adjs[0]))
                score+=1
            if(avd.includes(adjs[1]))
                score+=1
            return score
        })
        let minScore = 1e10
        let minScoreTryIdx = 0
        tryScores.forEach((tryScore, idx)=>{
            if(tryScore<minScore){
                minScore = tryScore
                minScoreTryIdx = idx
            }
        })
        return tryOrder[minScoreTryIdx]
    })
    const showingOps = computed<boolean>(()=>{
        return !!clientPos.value
    })

    const tryOrder:OpsAt[] = ['rb', 'r', 'b', 'rt', 'lb', 'l', 't', 'lt']
    const allAts:OpsAt[] = ['rb', 'r', 'rt', 't', 'lt', 'l', 'lb', 'b']
    function getAdjacentAts(at:OpsAt):OpsAt[]{
        const i = allAts.indexOf(at)
        if(i==0)
            return [allAts[1], allAts[7]]
        else if(i==7)
            return [allAts[6], allAts[0]]
        return [allAts[i-1], allAts[i+1]]
    }
    function way2at(way:SgnCoord):OpsAt{
        if(waySame(way, [1,1]))
            return 'rb'
        if(waySame(way, [1,0]))
            return 'r'
        if(waySame(way, [1,-1]))
            return 'rt'
        if(waySame(way, [0,-1]))
            return 't'
        if(waySame(way, [-1,-1]))
            return 'lt'
        if(waySame(way, [-1, 0]))
            return 'l'
        if(waySame(way, [-1,1]))
            return 'lb'
        return 'b'
    }
    return { clientPos, showingOps, at, btns, atAvoidWays }
})