import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { Coord } from "../coord";
import { useCvsFrameStore } from "./cvsFrameStore";
import { discardAreaXRatio } from "@/utils/consts";

export const useDiscardAreaStore = defineStore('discardArea', ()=>{
    const discarding = ref<boolean>(false)
    const cvsFrameStore = useCvsFrameStore()
    const { cvsFrame } = storeToRefs(cvsFrameStore)
    function getDiscardAreaLeftTipX(){
        const w = cvsFrame.value?.clientWidth||0
        const discardSideLength = w * discardAreaXRatio
        const restPartLength = w - discardSideLength
        return restPartLength
    }
    function getDiscardAreaPolyPts():Coord[]{
        const leftTipX = getDiscardAreaLeftTipX()
        const cvsWidth = cvsFrame.value?.clientWidth||0
        const polyPtsClientCoords:Coord[] = [
            [leftTipX, 0],
            [cvsWidth, 0],
            [cvsWidth,  cvsWidth - leftTipX]
        ]
        return polyPtsClientCoords.map(x=>cvsFrameStore.translateFromClient(x)||[0,0])
    }
    function discardStatus(clientCoord:Coord){
        const leftTipX = getDiscardAreaLeftTipX()
        const xyDiff = clientCoord[0] - clientCoord[1]
        const inArea = xyDiff > leftTipX
        discarding.value = inArea
        return inArea
    }
    function resetDiscarding(){
        discarding.value = false
    }
    return {
        discardStatus,
        discarding,
        getDiscardAreaPolyPts,
        resetDiscarding
    }
})