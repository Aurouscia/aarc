import { Scaler } from "@/utils/eventUtils/scaler";
import { defineStore, storeToRefs } from "pinia";
import { Ref, ref } from "vue";
import { Coord } from "../coord";
import { useSaveStore } from "./saveStore";

export const useCvsFrameStore = defineStore('cvsFrame', ()=>{
    const cvsFrame = ref<HTMLDivElement>()
    const cvsCont = ref<HTMLDivElement>()
    const saveStore = useSaveStore()
    const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
    let scaler:Scaler
    function initScaler(viewScaleHandler:()=>void, viewMoveHandler:()=>void, moveLocked:Ref<boolean>){
        if(!cvsFrame.value || !cvsCont.value)
            throw Error('初始化失败，找不到cvsFrame/cvsCont DOM对象')
        scaler = new Scaler(cvsFrame.value, cvsCont.value, viewScaleHandler, viewMoveHandler, moveLocked)
        scaler.widthReset()
    }
    function getViewCenterOffset(){
        return scaler.getCenterOffset()
    }
    function translateFromOffset(coordOffset:Coord):Coord|undefined{
        const [ox, oy] = coordOffset;
        const w = cvsCont.value?.offsetWidth;
        const h = cvsCont.value?.offsetHeight;
        if(!w || !h)
            return;
        const ratioX = cvsWidth.value/w
        const ratioY = cvsHeight.value/h
        return [ratioX*ox, ratioY*oy]
    }
    function translateFromClient(coordClient:Coord|undefined):Coord|undefined{
        if(!coordClient)
            return undefined
        const sx = cvsFrame.value?.scrollLeft;
        const sy = cvsFrame.value?.scrollTop;
        if(sx===undefined || sy===undefined)
            return;
        return translateFromOffset([coordClient[0] + sx, coordClient[1] + sy])
    }
    function translateToOffset(coord:Coord):Coord|undefined{
        const [cx, cy] = coord;
        const w = cvsCont.value?.offsetWidth;
        const h = cvsCont.value?.offsetHeight;
        if(!w || !h)
            return;
        const ratioX = cvsWidth.value/w
        const ratioY = cvsHeight.value/h
        return [cx/ratioX, cy/ratioY]
    }
    function translateToClient(coord:Coord):Coord|undefined{
        const offsetCoord = translateToOffset(coord)
        if(!offsetCoord)
            return
        const sx = cvsFrame.value?.scrollLeft;
        const sy = cvsFrame.value?.scrollTop;
        if(sx===undefined || sy===undefined)
            return;
        return [offsetCoord[0] - sx, offsetCoord[1] - sy]
    }
    function clientCoordRatio(clientCoord:Coord, axis:'x'|'y'):number{
        if(axis==='x')
            return clientCoord[0] / (cvsFrame.value?.clientWidth||1)
        else
            return clientCoord[1] / (cvsFrame.value?.clientHeight||1)
    }
    return {
        cvsFrame, cvsCont, initScaler, getViewCenterOffset,
        translateFromOffset, translateFromClient,
        translateToOffset, translateToClient,
        clientCoordRatio
    }
})