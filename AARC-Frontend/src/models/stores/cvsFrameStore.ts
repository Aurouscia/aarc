import { Scaler } from "@/utils/eventUtils/scaler";
import { defineStore, storeToRefs } from "pinia";
import { Ref, ref } from "vue";
import { Coord } from "../coord";
import { useSaveStore } from "./saveStore";
import { minDisplayRatio } from "@/utils/consts";
import { useScalerLocalConfigStore } from "@/app/localConfig/scalerLocalConfig";

export const useCvsFrameStore = defineStore('cvsFrame', ()=>{
    const cvsFrame = ref<HTMLDivElement>()
    const cvsCont = ref<HTMLDivElement>()
    const scaleLocked = ref<'free'|'max'|'min'>('free')
    const saveStore = useSaveStore()
    const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
    let scaler:Scaler
    const { steppedScaleEnabled } = storeToRefs(useScalerLocalConfigStore())
    function initScaler(viewScaleHandler:()=>void, viewMoveHandler:()=>void, moveLocked:Ref<boolean>){
        if(!cvsFrame.value || !cvsCont.value)
            throw Error('初始化失败，找不到cvsFrame/cvsCont DOM对象')
        const viewScaleHandlerFull = ()=>{
            updateScaleLock()//TODO：此处仅在调整大小后更新lock，实际上调整窗口尺寸也需要
            viewScaleHandler()
        }
        scaler = new Scaler(cvsFrame.value, cvsCont.value, viewScaleHandlerFull, viewMoveHandler, moveLocked, scaleLocked, steppedScaleEnabled)
        scaler.widthReset()
    }
    function getDisplayRatio(type:'x'|'y'|'smaller' = 'x'){
        if(!cvsCont.value)
            return 1;
        const wr = cvsWidth.value / cvsCont.value.clientWidth
        if(type == 'x'){
            return wr
        }
        const hr = cvsHeight.value / cvsCont.value.clientHeight
        if(type == 'y'){
            return hr
        }
        if(type == 'smaller'){
            return Math.min(wr, hr)
        }
        return 1
    }
    function updateScaleLock(){
        const cw = cvsCont.value?.clientWidth || 0
        const ch = cvsCont.value?.clientHeight || 0
        const fw = cvsFrame.value?.clientWidth || 0
        const fh = cvsFrame.value?.clientHeight || 0
        if(cw <= fw && ch <= fh){
            scaleLocked.value = 'min'
            return
        }
        const r = getDisplayRatio('smaller') || 0
        if(r < minDisplayRatio){
            scaleLocked.value = 'max'
            return
        }
        scaleLocked.value = 'free'
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
    function setSizeToCvsContStyle(){
        if(cvsCont.value && cvsFrame.value){
            cvsCont.value.style.width = cvsWidth.value+'px'
            cvsCont.value.style.height = cvsHeight.value+'px'
        }
    }
    return {
        cvsFrame, cvsCont, initScaler,
        getDisplayRatio, getViewCenterOffset,
        updateScaleLock,
        translateFromOffset, translateFromClient,
        translateToOffset, translateToClient,
        clientCoordRatio, setSizeToCvsContStyle
    }
})