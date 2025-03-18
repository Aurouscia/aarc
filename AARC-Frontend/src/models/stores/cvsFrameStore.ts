import { Scaler } from "@/utils/eventUtils/scaler";
import { defineStore, storeToRefs } from "pinia";
import { Ref, ref } from "vue";
import { Coord } from "../coord";
import { useSaveStore } from "./saveStore";

export const useCvsFrameStore = defineStore('cvsFrame', ()=>{
    const cvsFrame = ref<HTMLDivElement>()
    const cvsCont = ref<HTMLDivElement>()
    const scaleLocked = ref<'free'|'max'|'min'>('free')
    const saveStore = useSaveStore()
    const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
    let scaler:Scaler|undefined
    const viewScaleHandlers = ref<(()=>void)[]>([])
    const viewMoveHandlers = ref<(()=>void)[]>([])
    function initScaler(viewScaleHandler:()=>void, viewMoveHandler:()=>void, moveLocked:Ref<boolean>){
        if(!cvsFrame.value || !cvsCont.value)
            throw Error('初始化失败，找不到cvsFrame/cvsCont DOM对象')
        viewScaleHandlers.value.push(viewScaleHandler)
        viewMoveHandlers.value.push(viewMoveHandler)
        const viewScaleHandlerFull = ()=>{
            updateScaleLock()//TODO：此处仅在调整大小后更新lock，实际上调整窗口尺寸也需要
            viewScaleHandlers.value.forEach(h=>h())
        }
        const viewMoveHandlerFull = ()=>{
            viewMoveHandlers.value.forEach(h=>h())
        }
        scaler = new Scaler(cvsFrame.value, cvsCont.value, viewScaleHandlerFull, viewMoveHandlerFull, moveLocked, scaleLocked)
        scaler.widthReset()
    }
    function getDisplayRatio(type:'x'|'y'|'smaller'|'bigger' = 'x'){
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
        if(type == 'bigger'){
            return Math.max(wr, hr)
        }
        return 1
    }
    function getBiggerSideLength(){
        //当前屏幕上显示的最大边长(像素数)
        const wf = cvsFrame.value?.clientWidth || 0
        const hf = cvsFrame.value?.clientHeight || 0
        const wc = cvsCont.value?.clientWidth || 0
        const hc = cvsCont.value?.clientHeight || 0
        const wr = wf/wc
        const hr = hf/hc
        const wpx = wr*cvsWidth.value
        const hpx = hr*cvsHeight.value
        return Math.max(wpx, hpx)
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
        const r = getBiggerSideLength()
        if(r < 400){
            scaleLocked.value = 'max'
            return
        }
        scaleLocked.value = 'free'
    }
    function getViewCenterOffset(){
        return scaler?.getCenterOffset() || {x:0,y:0}
    }
    function getViewRectInRatio(){
        return scaler?.getViewRectInRatio() || {left:0, right:0, top:0, bottom:0}
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
    function initContSizeStyle(){
        scaler?.disposeArenaHWCache()
        if(cvsCont.value && cvsFrame.value){
            const pxHW = cvsHeight.value / cvsWidth.value
            const widthShould = cvsFrame.value.clientWidth
            const heightShould = widthShould * pxHW
            cvsCont.value.style.width = widthShould+'px'
            cvsCont.value.style.height = heightShould+'px'
        }
    }
    return {
        cvsFrame, cvsCont, initScaler,
        getDisplayRatio, getBiggerSideLength,
        getViewCenterOffset, getViewRectInRatio,
        updateScaleLock,
        translateFromOffset, translateFromClient,
        translateToOffset, translateToClient,
        clientCoordRatio, initContSizeStyle,
        viewMoveHandlers, viewScaleHandlers
    }
})