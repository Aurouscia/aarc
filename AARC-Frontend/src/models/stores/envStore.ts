import { defineStore } from "pinia";
import { ref } from "vue";
import { useSaveStore } from "./saveStore";
import { Scaler } from "@/utils/scaler";
import { Coord, FormalPt } from "../coord";
import { coordDistSq } from "@/utils/coordDist";
import { clickControlPointThrsSq } from "@/utils/consts";
import { listenPureClick } from "@/utils/pureClick";
import { eventClientCoord } from "@/utils/eventClientCoord";
import { coordOnLineOfFormalPts } from "@/utils/coordOnLine";
import { OpsBtn, OpsBtnType, useOpsStore } from "./opsStore";
import { ControlPointDir } from "../save";

export const useEnvStore = defineStore('env', ()=>{
    const movingPoint = ref<boolean>(false)
    const movedPoint = ref<boolean>(false)
    const saveStore = useSaveStore();
    const opsStore = useOpsStore();
    const activePtId = ref<number>(-1)
    const activeLineId = ref<number>(-1)
    const cursorPos = ref<Coord>()
    const cursorDir = ref<ControlPointDir>(ControlPointDir.vertical)
    const cursorOnLineAfterPtIdx = ref<number>(-1)
    const cvsFrame = ref<HTMLDivElement>()
    const cvsCont = ref<HTMLDivElement>()
    const cvsWidth = ref<number>(1)
    const cvsHeight = ref<number>(1)
    let scaler:Scaler;
    const pointMoved = ref<(changedLines:number[])=>void>(()=>{});
    const rescaled = ref<(()=>void)[]>([])
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
            //如果已经移动过点，这时formalPts还未更新，不应该进行点击线路判断，直接视为点击空白处
            const line = !movedPoint.value && onLine(coord);
            if(line && line.length>0){
                //点到线上了
                let line0 = line[0]
                activeLineId.value = line0.lineId
                activePtId.value = -1
                cursorPos.value = [...line0.alignedPos]
                cursorOnLineAfterPtIdx.value = line0.afterPtIdx
                cursorDir.value = line0.dir
                setOpsPos(line0.alignedPos)
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
            setOpsPos(false)
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
    function onLine(c:Coord, exceptLines:number[] = []){
        const res:{lineId:number, alignedPos:Coord, afterPtIdx:number, dir:ControlPointDir}[] = []
        linesFormalPts.forEach(line=>{
            if(exceptLines.includes(line.lineId))
                return;
            const onLineRes = coordOnLineOfFormalPts(c, line.pts)
            if(onLineRes){
                res.push({
                    lineId: line.lineId,
                    alignedPos: onLineRes.aligned,
                    afterPtIdx: onLineRes.afterPt,
                    dir: onLineRes.dir
                })
            }
        })
        return res
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

    const linesFormalPts:{lineId:number, pts:FormalPt[]}[] = []
    function setLinesFormalPts(lineId:number, pts:FormalPt[]){
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
        const ptId = activePtId.value;
        const pt = saveStore.save?.points.find(x=>x.id==ptId)
        if(!pt){
            opsStore.btns = []
            return;
        }
        const relatedLines = saveStore.getLinesByPt(ptId)
        const relatedLineIds = relatedLines.map(line=>line.id)
        const onLineRes = onLine(pt.pos, relatedLineIds)
        const addToLines = onLineRes.map<OpsBtn>(l=>{
            const color = saveStore.save?.lines.find(x=>x.id==l.lineId)?.color
            return{
                type:'addPtTL' as OpsBtnType,
                cb:()=>{
                    saveStore.insertPtToLine(ptId, l.lineId, l.afterPtIdx, l.alignedPos, l.dir);
                    pointMoved.value([l.lineId, ...relatedLineIds])
                },
                color
            }
        })
        const rmFromLines = relatedLines.map(l=>{
            return{
                type:'rmPtFL' as OpsBtnType,
                cb:()=>{
                    saveStore.removePtFromLine(ptId, l.id);
                    pointMoved.value([l.id, ...relatedLineIds])
                },
                color: l.color
            }
        })
        const rmPtCb = ()=>{
            saveStore.removePt(activePtId.value);
            activePtId.value = -1
            activeLineId.value = -1
            cursorPos.value = undefined
            setOpsPos(false)
            pointMoved.value(relatedLineIds)
        }
        const swDirCb = ()=>{
            if(pt){
                if(pt.dir == ControlPointDir.incline)
                    pt.dir = ControlPointDir.vertical
                else
                    pt.dir = ControlPointDir.incline
                pointMoved.value(relatedLineIds)
            }
        }
        opsStore.btns = [
            {
                type:'swPtDir',
                cb:swDirCb
            },
            {
                type:'rmPt',
                cb:rmPtCb
            },
            ...addToLines,
            ...rmFromLines
        ]
    }
    function setOpsForLine(){
        const insertPtCb = ()=>{
            if(cursorPos.value){
                const id = saveStore.insertPtOnLine(activeLineId.value, cursorOnLineAfterPtIdx.value, cursorPos.value, cursorDir.value)
                pointMoved.value([activeLineId.value])
                if(id!==undefined){
                    activePtId.value = id
                    setOpsForPt()
                }
            }
        }
        opsStore.btns = [
            {
                type:'addPt',
                cb: insertPtCb
            }
        ]
    }

    function getDisplayRatio(){
        if(!cvsCont.value)
            return 1;
        const wr = cvsWidth.value / cvsCont.value.clientWidth
        return wr
    }
    
    return { 
        init, activePtId, activeLineId, cursorPos,
        cvsFrame, cvsCont, cvsWidth, cvsHeight, getDisplayRatio,
        pointMoved, rescaled, setLinesFormalPts
    }
})