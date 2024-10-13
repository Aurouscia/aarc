import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useSaveStore } from "./saveStore";
import { Scaler } from "@/utils/scaler";
import { Coord, FormalPt, RectCoord } from "../coord";
import { coordDistSq } from "@/utils/coordDist";
import { clickControlPointThrsSq } from "@/utils/consts";
import { listenPureClick } from "@/utils/pureClick";
import { eventClientCoord } from "@/utils/eventClientCoord";
import { coordOnLineOfFormalPts } from "@/utils/coordOnLine";
import { OpsBtn, OpsBtnType, useOpsStore } from "./opsStore";
import { ControlPointDir, ControlPointSta } from "../save";
import { useSnapStore } from "./snapStore";
import { rectInside } from "@/utils/rectInside";
import { coordAdd, coordSub } from "@/utils/coordMath";
import { useNameEditStore } from "./nameEditStore";

export const useEnvStore = defineStore('env', ()=>{
    const movingPoint = ref<boolean>(false)
    const movedPoint = ref<boolean>(false)
    const saveStore = useSaveStore();
    const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
    const opsStore = useOpsStore();
    const activePtId = ref<number>(-1)
    const activePtType = ref<'body'|'name'>('body')
    const activePtNameGrabbedAt = ref<Coord>([0,0])
    const activePtNameSnapped = ref<'no'|'vague'|'accu'>('no')
    const nameEditStore = useNameEditStore()
    const activeLineId = ref<number>(-1)
    const cursorPos = ref<Coord>()
    const cursorDir = ref<ControlPointDir>(ControlPointDir.vertical)
    const cursorOnLineAfterPtIdx = ref<number>(-1)
    const cvsFrame = ref<HTMLDivElement>()
    const cvsCont = ref<HTMLDivElement>()
    let scaler:Scaler;
    const pointMutated = ref<(changedLines:number[], staNameMoved:number[])=>void>(()=>{});
    const rescaled = ref<(()=>void)[]>([])
    const { snap, snapName } = useSnapStore()
    function init(){
        if(!cvsCont.value || !cvsFrame.value)
            return
        scaler = new Scaler(cvsFrame.value, cvsCont.value, rescaleHandler, movingPoint)
        scaler.widthReset()
        listenPureClick(cvsCont.value, pureClickHandler)
        cvsCont.value.addEventListener('mousedown', moveStartHandler)
        cvsCont.value.addEventListener('touchstart', moveStartHandler)
        cvsCont.value.addEventListener('mousemove', movingHandler)
        cvsCont.value.addEventListener('touchmove', movingHandler)
        cvsCont.value.addEventListener('mouseup', moveEndHandler)
        cvsCont.value.addEventListener('touchend', moveEndHandler)
    }
    let rescaleDelayTimer = 0;
    function rescaleHandler(){
        setOpsPos(false)
        window.clearTimeout(rescaleDelayTimer)
        rescaleDelayTimer = window.setTimeout(()=>{
            rescaled.value.forEach(f=>f())
        }, 200)
    }
    
    function pureClickHandler(clientCord:Coord){
        const coord = translateFromClient(clientCord);
        if(!coord)
            return
        //判断是否在点上
        const pt = onPt(coord)
        if(pt){
            //点到点上了
            activePtId.value = pt.id
            activePtType.value = 'body'
            activeLineId.value = -1
            cursorPos.value = [...pt.pos]
            setOpsPos(pt.pos)
            setOpsForPt()
            nameEditStore.endEditing()
            return
        }
        //判断是否在站名上
        const staName = !movedPoint.value && onStaName(coord)
        if(staName){
            //点到站名上了
            activePtId.value = staName.id
            activePtType.value = 'name'
            activeLineId.value = -1
            nameEditStore.startEditing(staName.id)
            setOpsPos(false)
            return
        }else{
            nameEditStore.endEditing()
        }
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
            return
        }
        //点击空白位置
        let changedLines:number[] = []
        let movedStaNames:number[] = []
        if(activePtId.value > 0){
            changedLines = saveStore.getLinesByPt(activePtId.value).map(x=>x.id)
            movedStaNames.push(activePtId.value)
        }
        activePtId.value = -1
        activeLineId.value = -1
        cursorPos.value = undefined
        setOpsPos(false)
        pointMutated.value(changedLines, movedStaNames)
        movedPoint.value = false
    }
    function moveStartHandler(e:MouseEvent|TouchEvent){
        const clientCoord = eventClientCoord(e)
        if(!clientCoord)
            return;
        const coord = translateFromClient(clientCoord);
        if(!coord)
            return;
        if(activePtId.value > 0){
            if(activePtType.value == 'body'){
                const pt = onPt(coord)
                if(pt && pt.id === activePtId.value){
                    movingPoint.value = true
                }
            }else if(activePtType.value == 'name'){
                const pt = onStaName(coord)
                if(pt && pt.id === activePtId.value){
                    movingPoint.value = true
                    const nameGlobalPos = coordAdd(pt.nameP || [0,0], pt.pos)
                    activePtNameGrabbedAt.value = coordSub(coord, nameGlobalPos)
                }
            }
        }
    }
    function movingHandler(e:MouseEvent|TouchEvent){
        if(movingPoint.value){
            setOpsPos(false)
            const clientCoord = eventClientCoord(e)
            if(!clientCoord)
                return;
            const coord = translateFromClient(clientCoord);
            const pt = saveStore.save?.points.find(x=>x.id === activePtId.value)
            if(pt && coord){
                if(activePtType.value=='body'){
                    pt.pos = coord;
                    const snapRes = snap(pt)
                    if(snapRes)
                        pt.pos = snapRes
                    cursorPos.value = coord
                }else if(activePtType.value=='name'){
                    const nameGlobalPos = coordSub(coord, activePtNameGrabbedAt.value)
                    pt.nameP = coordSub(nameGlobalPos, pt.pos)
                    const snapRes = snapName(pt)
                    if(snapRes){
                        pt.nameP = snapRes.to
                        activePtNameSnapped.value = snapRes.type
                    }else{
                        activePtNameSnapped.value = 'no'
                    }
                }
                movedPoint.value = true
            }
        }
    }
    function moveEndHandler(){
        //手指离开屏幕时，touches为空数组，无法获取位置
        movingPoint.value = false
        activePtNameGrabbedAt.value = [0,0]
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
    function onStaName(c:Coord){
        for(const rect of staNameRects){
            if(rectInside(rect.rect, c)){
                const pt = saveStore.save?.points.find(pt => pt.id == rect.ptId)
                return pt
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
    const staNameRects:{ptId:number, rect:RectCoord}[] = []
    function setStaNameRects(ptId:number, rect:RectCoord){
        let target = staNameRects.find(x=>x.ptId == ptId)
        if(!target){
            target = {ptId, rect}
            staNameRects.push(target)
        }
        else{
            target.rect = rect
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
                    pointMutated.value([l.lineId, ...relatedLineIds], [ptId])
                },
                color
            }
        })
        const rmFromLines = relatedLines.map(l=>{
            return{
                type:'rmPtFL' as OpsBtnType,
                cb:()=>{
                    saveStore.removePtFromLine(ptId, l.id);
                    pointMutated.value([l.id, ...relatedLineIds], [])
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
            pointMutated.value(relatedLineIds, [])
        }
        const swDirCb = ()=>{
            if(pt){
                if(pt.dir == ControlPointDir.incline)
                    pt.dir = ControlPointDir.vertical
                else
                    pt.dir = ControlPointDir.incline
                pointMutated.value(relatedLineIds, [])
            }
        }
        const swSta = ()=>{
            if(pt){
                if(pt.sta == ControlPointSta.plain)
                    pt.sta = ControlPointSta.sta
                else
                    pt.sta = ControlPointSta.plain
                pointMutated.value([], [])
            }
        }
        opsStore.btns = [
            {
                type:'swPtDir',
                cb:swDirCb
            },
            {
                type:'swPtSta',
                cb:swSta
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
                pointMutated.value([activeLineId.value], [])
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

    function getDisplayRatio(soften = 1){
        if(!cvsCont.value)
            return 1;
        const wr = cvsWidth.value / cvsCont.value.clientWidth
        if(soften){
            return 1+(wr-1)*soften
        }
        return wr
    }
    
    return { 
        init, activePtId, activePtType, activePtNameSnapped,
        activeLineId, cursorPos, movingPoint,
        cvsFrame, cvsCont, cvsWidth, cvsHeight, getDisplayRatio,
        pointMutated, rescaled, setLinesFormalPts, setStaNameRects
    }
})