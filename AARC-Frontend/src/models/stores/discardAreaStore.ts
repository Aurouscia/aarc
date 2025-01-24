import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { Coord } from "../coord";
import { useCvsFrameStore } from "./cvsFrameStore";
import { discardAreaSideRatio } from "@/utils/consts";

export const useDiscardAreaStore = defineStore('discardArea', ()=>{
    const discarding = ref<'no'|'hint'|'active'>('no')
    const cvsFrameStore = useCvsFrameStore()
    const { cvsFrame } = storeToRefs(cvsFrameStore)
    function getDiscardAreaSideLength(){
        const w = cvsFrame.value?.clientWidth||0
        const h = cvsFrame.value?.clientHeight||0
        return Math.min(w, h) * discardAreaSideRatio
    }
    function getDiscardAreaPolyPts():Coord[]{
        const sideLength = getDiscardAreaSideLength()
        const polyPtsClientCoords:Coord[] = [
            [sideLength, 0],
            [0, 0],
            [0, sideLength]
        ]
        return polyPtsClientCoords.map(x=>cvsFrameStore.translateFromClient(x)||[0,0])
    }
    function discardStatus(clientCoord:Coord){
        const sideLength = getDiscardAreaSideLength()
        const xySum = clientCoord[0] + clientCoord[1]
        const inArea = xySum < sideLength
        discarding.value = inArea ? 'active' : 'hint'
        return inArea
    }
    function resetDiscarding(){
        discarding.value = 'no'
    }
    return {
        discardStatus,
        discarding,
        getDiscardAreaPolyPts,
        resetDiscarding
    }
})