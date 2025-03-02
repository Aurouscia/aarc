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
        return (w + h)/2 * discardAreaSideRatio
    }
    function getDiscardAreaInfo():{poly:Coord[], origin:Coord, size:number}{
        const sideLength = getDiscardAreaSideLength()
        const originClient:Coord = [0, 0]
        const rightClient:Coord = [sideLength, 0]
        const lowClient:Coord = [0, sideLength]
        const origin = cvsFrameStore.translateFromClient(originClient) || [0,0]
        const right = cvsFrameStore.translateFromClient(rightClient) || [0,0]
        const low = cvsFrameStore.translateFromClient(lowClient) || [0,0]
        const size = right[0]-origin[0]
        const poly = [origin, low, right]
        return {
            poly,
            origin,
            size
        }
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
        getDiscardAreaInfo,
        resetDiscarding
    }
})