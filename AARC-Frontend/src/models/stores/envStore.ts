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
import { useOpsStore } from "./opsStore";

export const useEnvStore = defineStore('env', ()=>{
    const movingPoint = ref<boolean>(false)
    const movedPoint = ref<boolean>(false)
    const saveStore = useSaveStore();
    const opsStore = useOpsStore();
    const activePtId = ref<number>(-1)
    const activeLineId = ref<number>(-1)
    const cursorPos = ref<Coord>()
    const cvsFrame = ref<HTMLDivElement>()
    const cvsCont = ref<HTMLDivElement>()
    const cvsWidth = ref<number>(1)
    const cvsHeight = ref<number>(1)
    let scaler:Scaler;
    const pointMoved = shallowRef<(changedLines:number[])=>void>(()=>{});
    const rescaled = shallowRef<(()=>void)[]>([])
    function init(){
        if(!cvsCont.value || !cvsFrame.value)
            return
        scaler = new Scaler(cvsFrame.value, cvsCont.value, rescaleHandler, movingPoint)
        scaler.widthReset()
        listenPureClick(cvsCont.value, pureClickHandlerBinded)
        cvsCont.value.addEventListener('mousedown', moveStartHandlerBinded)
        cvsCont.value.addEventListener('touchstart', moveStartHandlerBinded)
        cvsCont.value.addEventListener('mousemove', movingHandlerBinded)
        cvsCont.value.addEventListener('touchmove', movingHandlerBinded)
        cvsCont.value.addEventListener('mouseup', moveEndHandlerBinded)
        cvsCont.value.addEventListener('touchend', moveEndHandlerBinded)
    }
    let rescaleDelayTimer = 0;
    function rescaleHandler(){
        setOpsPos(false)
        window.clearTimeout(rescaleDelayTimer)
        rescaleDelayTimer = window.setTimeout(()=>{
            rescaled.value.forEach(f=>f())
        }, 200)
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
            cursorPos.value = [...pt.pos]
            setOpsPos(pt.pos)
            setOpsForPt()
        }else{
            //判断是否在线上
            const line = !movedPoint.value && onLine(coord);
            if(line){
                //点到线上了
                activeLineId.value = line.lineId
                activePtId.value = -1
                cursorPos.value = [...line.alignedPos]
                setOpsPos(line.alignedPos)
                setOpsForLine()
            }
            else{
                let changedLines:number[] = []
                if(activePtId.value){
                    changedLines = saveStore.getLinesByPt(activePtId.value).map(x=>x.id)
                }
                activePtId.value = -1
                activeLineId.value = -1
                cursorPos.value = undefined
                setOpsPos(false)
                pointMoved.value(changedLines)
                movedPoint.value = false
            }
        }
    }

    const moveStartHandlerBinded = moveStartHandler.bind(this)
    function moveStartHandler(e:MouseEvent|TouchEvent){
        setOpsPos(false)
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
            cursorPos.value = coord
            movedPoint.value = true
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
    function onLine(c:Coord):{lineId:number, alignedPos:Coord}|undefined{
        let alignedPos = [0,0] as Coord;
        const lineId = linesFormalPts.find(line=>{
            const aligned = coordOnLineOfFormalPts(c, line.pts)
            console.log(aligned)
            if(aligned){
                alignedPos = aligned
                return true
            }
        })?.lineId
        if(lineId){
            return {
                lineId,
                alignedPos
            }
        }
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

    function setOpsPos(coord:Coord|false){
        if(!coord){
            opsStore.show = false;
            opsStore.btns = []
            return
        }
        const clientCoord = translateToClient(coord)
        if(!clientCoord)
            return
        opsStore.clientPos = clientCoord
        opsStore.show = true
    }
    function setOpsForPt(){
        opsStore.btns = [
            {
                type:'rmPt',
                cb:()=>window.alert('移除该点')
            }
        ]
    }
    function setOpsForLine(){
        opsStore.btns = [
            {
                type:'addPt',
                cb:()=>window.alert('在此处添加点')
            }
        ]
    }

    function getDisplayRatio(){
        if(!cvsCont.value)
            return 1;
        const wr = cvsWidth.value / cvsCont.value.clientWidth
        const hr = cvsHeight.value / cvsCont.value.clientHeight
        return Math.max(wr, hr)
    }
    
    return { 
        init, activePtId, activeLineId, cursorPos,
        cvsFrame, cvsCont, cvsWidth, cvsHeight, getDisplayRatio,
        pointMoved, rescaled, setLinesFormalPts
    }
})