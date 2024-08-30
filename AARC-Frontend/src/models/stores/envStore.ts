import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import { useSaveStore } from "./saveStore";
import { Scaler } from "@/utils/scaler";
import { Coord } from "../coord";
import { coordDistSq } from "@/utils/coordDist";
import { clickControlPointThrsSq } from "@/utils/consts";
import { listenPureClick } from "@/utils/pureClick";
import { eventClientCoord } from "@/utils/eventClientCoord";
import { coordOnLineOfFormalPts } from "@/utils/coordOnLine";
import { OpsPosProps } from "@/components/Ops.vue";

export const useEnvStore = defineStore('env', ()=>{
    const movingPoint = ref<boolean>(false)
    const saveStore = useSaveStore();
    const activePtId = ref<number>(-1)
    const activeLineId = ref<number>(-1)
    const cvsFrame = ref<HTMLDivElement>()
    const cvsCont = ref<HTMLDivElement>()
    const cvsWidth = ref<number>(1)
    const cvsHeight = ref<number>(1)
    let scaler:Scaler;
    const renderMain = shallowRef<(changedLines:number[])=>void>(()=>{});
    function init(){
        if(!cvsCont.value || !cvsFrame.value)
            return
        scaler = new Scaler(cvsFrame.value, cvsCont.value, ()=>{
            setOps(false)
        }, movingPoint)
        scaler.widthReset()
        listenPureClick(cvsCont.value, pureClickHandlerBinded)
        cvsCont.value.addEventListener('mousedown', moveStartHandlerBinded)
        cvsCont.value.addEventListener('touchstart', moveStartHandlerBinded)
        cvsCont.value.addEventListener('mousemove', movingHandlerBinded)
        cvsCont.value.addEventListener('touchmove', movingHandlerBinded)
        cvsCont.value.addEventListener('mouseup', moveEndHandlerBinded)
        cvsCont.value.addEventListener('touchend', moveEndHandlerBinded)
    }
    
    const pureClickHandlerBinded = pureClickHandler.bind(this) 
    function pureClickHandler(clientCord:Coord){
        const coord = translateFromClient(clientCord);
        if(!coord)
            return
        //判断是否在点上
        const pt = onPt(coord)
        if(pt){
            //点到点上了
            activePtId.value = pt.id
            activeLineId.value = -1
            setOps(pt.pos)
        }else{
            //判断是否在线上
            const line = onLine(coord);
            if(line){
                //点到线上了
                activeLineId.value = line
                activePtId.value = -1
                setOps(coord)
            }
            else{
                let changedLines:number[] = []
                if(activePtId.value){
                    changedLines = saveStore.getLinesByPt(activePtId.value).map(x=>x.id)
                }
                activePtId.value = -1
                activeLineId.value = -1
                setOps(false)
                renderMain.value(changedLines)
            }
        }
    }

    const moveStartHandlerBinded = moveStartHandler.bind(this)
    function moveStartHandler(e:MouseEvent|TouchEvent){
        setOps(false)
        const clientCoord = eventClientCoord(e)
        if(!clientCoord)
            return;
        const coord = translateFromClient(clientCoord);
        if(!coord)
            return;
        const pt = onPt(coord)
        if(pt && pt.id === activePtId.value){
            movingPoint.value = true
        }
    }

    const movingHandlerBinded = movingHandler.bind(this)
    function movingHandler(e:MouseEvent|TouchEvent){
        if(movingPoint.value){
            const clientCoord = eventClientCoord(e)
            if(!clientCoord)
                return;
            const coord = translateFromClient(clientCoord);
            const pt = saveStore.save?.points.find(x=>x.id === activePtId.value)
            if(pt && coord)
                pt.pos = coord
        }
    }

    const moveEndHandlerBinded = moveEndHandler.bind(this)
    function moveEndHandler(){
        //手指离开屏幕时，touches为空数组，无法获取位置
        movingPoint.value = false
    }

    function onPt(c:Coord){
        return saveStore.save?.points.find(p=>{
            const distSq = coordDistSq(p.pos, c)
            return distSq < clickControlPointThrsSq
        })
    }
    function onLine(c:Coord){
        return linesFormalPts.find(line=>{
            return coordOnLineOfFormalPts(c, line.pts)
        })?.lineId
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
    function translateFromClient(coordClient:Coord):Coord|undefined{
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

    const linesFormalPts:{lineId:number, pts:Coord[]}[] = []
    function setLinesFormalPts(lineId:number, pts:Coord[]){
        let target = linesFormalPts.find(x=>x.lineId == lineId)
        if(!target){
            target = {lineId, pts}
            linesFormalPts.push(target)
        }
        else{
            target.pts = pts
        }
    }

    const opsProps = ref<OpsPosProps>({show:false, x:0, y:0, at:'rb'})
    function setOps(coord:Coord|false){
        if(!coord){
            opsProps.value.show = false
            return
        }
        const clientCoord = translateToClient(coord)
        if(!clientCoord)
            return
        opsProps.value = {
            show: true,
            x:clientCoord[0],
            y:clientCoord[1],
            at: ['lt', 'rt', 'lb', 'rb'][Math.floor(Math.random()*3.99)] as any
        }
    }
    
    return { 
        init, activePtId, activeLineId,
        cvsFrame, cvsCont, cvsWidth, cvsHeight, 
        renderMain, setLinesFormalPts,
        opsProps
    }
})