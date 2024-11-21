import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useSaveStore } from "./saveStore";
import { Scaler } from "@/utils/eventUtils/scaler";
import { Coord } from "../coord";
import { listenPureClick } from "@/utils/eventUtils/pureClick";
import { eventClientCoord } from "@/utils/eventUtils/eventClientCoord";
import { OpsBtn, OpsBtnType, useOpsStore } from "./opsStore";
import { ControlPoint, ControlPointDir, ControlPointSta, Line } from "../save";
import { useSnapStore } from "./snapStore";
import { coordAdd, coordSub } from "@/utils/coordUtils/coordMath";
import { useNameEditStore } from "./nameEditStore";
import { useFormalizedLineStore } from "./saveDerived/formalizedLineStore";
import { useStaNameRectStore } from "./saveDerived/staNameRectStore";
import { useStaClusterStore } from "./saveDerived/staClusterStore";
import { useOnDetectStore } from "./saveDerived/saveDerivedDerived/onDetectStore";

export const useEnvStore = defineStore('env', ()=>{
    const movingPoint = ref<boolean>(false)
    const movedPoint = ref<boolean>(false)
    const saveStore = useSaveStore();
    const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
    const opsStore = useOpsStore();
    const activePt = ref<ControlPoint>()
    const activePtType = ref<'body'|'name'>('body')
    const activePtNameGrabbedAt = ref<Coord>([0,0])
    const activePtNameSnapped = ref<'no'|'vague'|'accu'>('no')
    const nameEditStore = useNameEditStore()
    const staClusterStore = useStaClusterStore()
    const activeLine = ref<Line>()
    const cursorPos = ref<Coord>()
    const cursorDir = ref<ControlPointDir>(ControlPointDir.vertical)
    const cursorOnLineAfterPtIdx = ref<number>(-1)
    const cvsFrame = ref<HTMLDivElement>()
    const cvsCont = ref<HTMLDivElement>()
    let scaler:Scaler;
    const pointMutated = ref<(changedLines?:number[], staNameMoved?:number[])=>void>(()=>{});
    const rescaled = ref<(()=>void)[]>([])
    const { snap, snapName, snapNameStatus, snapGrid } = useSnapStore()
    const { setLinesFormalPts } = useFormalizedLineStore()
    const { setStaNameRects } = useStaNameRectStore()
    const { onPt, onLine, onStaName } = useOnDetectStore()
    function init(){
        if(!cvsCont.value || !cvsFrame.value)
            return
        scaler = new Scaler(cvsFrame.value, cvsCont.value, viewRescaleHandler, viewMoveHandler, movingPoint)
        scaler.widthReset()
        nameEditStore.nameInputFocusHandler = ()=>{setOpsPos(false)}
        listenPureClick(cvsCont.value, pureClickHandler)
        cvsCont.value.addEventListener('mousedown', moveStartHandler)
        cvsCont.value.addEventListener('touchstart', moveStartHandler)
        cvsCont.value.addEventListener('mousemove', movingHandler)
        cvsCont.value.addEventListener('touchmove', movingHandler)
        cvsCont.value.addEventListener('mouseup', moveEndHandler)
        cvsCont.value.addEventListener('touchend', moveEndHandler)
    }
    let rescaleDelayTimer = 0;
    function viewRescaleHandler(){
        setOpsPos(false)
        window.clearTimeout(rescaleDelayTimer)
        rescaleDelayTimer = window.setTimeout(()=>{
            rescaled.value.forEach(f=>f())
        }, 200)
    }
    function viewMoveHandler(){
        setOpsPos(false)
    }
    
    function pureClickHandler(clientCord:Coord){
        const coord = translateFromClient(clientCord);
        if(!coord)
            return
        //判断是否处于某种需要退出的状态（点击任何东西都算点击空白处（退出状态））
        const doingSth = movedPoint.value || nameEditStore.edited
        //const doingSth = false

        //判断是否在站名上
        const staName = onStaName(coord)
        if(staName && !(doingSth && activePt.value?.id !== staName.id)){
            //点到站名上了
            activePt.value = saveStore.getPtById(staName.id)
            activePtType.value = 'name'
            activeLine.value = undefined
            nameEditStore.startEditing(staName.id)
            cursorPos.value = undefined
            setOpsPos(false)
            //立即检查该点是否是snap位置
            if(activePt.value){
                const snapRes = snapNameStatus(activePt.value)
                if(snapRes){
                    activePtNameSnapped.value = snapRes.type
                }else{
                    activePtNameSnapped.value = 'no'
                }
            }
            return
        }else{
            nameEditStore.endEditing()
        }

        //判断是否在点上
        const pt = onPt(coord, true)
        if(pt && !(doingSth && activePt.value?.id !== pt.id)){
            //点到点上了
            activePt.value = pt
            activePtType.value = 'body'
            activeLine.value = undefined
            cursorPos.value = [...pt.pos]
            setOpsPos(pt.pos)
            setOpsForPt()
            nameEditStore.startEditing(pt.id)
            return
        }
        
        //判断是否在线上
        //如果已经移动过点，这时formalPts还未更新，不应该进行点击线路判断，直接视为点击空白处
        const lineMatches = !doingSth && onLine(coord);
        if(lineMatches && lineMatches.length>0){
            //点到线上了
            const lineMatch = lineMatches[0]
            activeLine.value = saveStore.getLineById(lineMatch.lineId)
            activePt.value = undefined
            cursorPos.value = [...lineMatch.alignedPos]
            cursorOnLineAfterPtIdx.value = lineMatch.afterPtIdx
            cursorDir.value = lineMatch.dir
            setOpsPos(lineMatch.alignedPos)
            setOpsForLine()
            return
        }
        //点击空白位置
        let changedLines:number[] = []
        let movedStaNames:number[] = []
        if(activePt.value){
            const tryMergeRes = saveStore.tryMergePt(activePt.value?.id)
            if(tryMergeRes){
                changedLines.push(...tryMergeRes.mutatedLines.map(x=>x.id))
                movedStaNames.push(tryMergeRes.mergedByPt.id, activePt.value.id)
            }else{
                changedLines.push(...saveStore.getLinesByPt(activePt.value.id).map(x=>x.id))
                movedStaNames.push(activePt.value.id)
            }
        }
        activePt.value = undefined
        activeLine.value = undefined
        cursorPos.value = undefined
        setOpsPos(false)
        pointMutated.value(changedLines, movedStaNames)
        movedPoint.value = false
        activePtNameSnapped.value = 'no'
    }
    function moveStartHandler(e:MouseEvent|TouchEvent){
        const clientCoord = eventClientCoord(e)
        if(!clientCoord)
            return;
        const coord = translateFromClient(clientCoord);
        if(!coord)
            return;
        if(activePt.value){
            const pt = onStaName(coord)
            if(pt && pt === activePt.value){
                activePtType.value = 'name'
                movingPoint.value = true
                cursorPos.value = undefined
                //鼠标/手指抓住的点不一定是站名原点，需要做个记录和变换
                const nameGlobalPos = coordAdd(pt.nameP || [0,0], pt.pos)
                activePtNameGrabbedAt.value = coordSub(coord, nameGlobalPos)
            }else{
                const pt = onPt(coord, true)
                if(pt && pt === activePt.value){
                    activePtType.value = 'body'
                    movingPoint.value = true
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
            let pt = activePt.value
            if(pt && coord){
                if(activePtType.value=='body'){
                    pt.pos = coord;
                    const snapRes = snap(pt)
                    if(snapRes)
                        pt.pos = snapRes
                    cursorPos.value = coord
                }else if(activePtType.value=='name'){
                    const transferRes = staClusterStore.tryTransferStaNameWithinCluster(pt)
                    if(transferRes){
                        pt.name = undefined
                        pt.nameS = undefined 
                        pt.nameP = undefined
                        setStaNameRects(pt.id, false)
                        nameEditStore.targetPtId = transferRes.id
                        activePt.value = transferRes
                        pt = transferRes
                    }
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
        const pt = activePt.value;
        if(!pt){
            opsStore.btns = []
            return;
        }
        const relatedLines = saveStore.getLinesByPt(pt.id)
        const relatedLineIds = relatedLines.map(line=>line.id)
        const onLineRes = onLine(pt.pos, relatedLineIds)
        const addToLines = onLineRes.map<OpsBtn>(l=>{
            const color = saveStore.save?.lines.find(x=>x.id==l.lineId)?.color
            return{
                type:'addPtTL' as OpsBtnType,
                cb:()=>{
                    saveStore.insertPtToLine(pt.id, l.lineId, l.afterPtIdx, l.alignedPos, l.dir);
                    pointMutated.value([l.lineId, ...relatedLineIds], [pt.id])
                    setOpsForPt()
                },
                color
            }
        })
        const rmFromLines = relatedLines.map(l=>{
            return{
                type:'rmPtFL' as OpsBtnType,
                cb:()=>{
                    saveStore.removePtFromLine(pt.id, l.id);
                    pointMutated.value([l.id, ...relatedLineIds], [])
                    pointlessLineScan()
                    setOpsForPt()
                    activeLine.value = undefined
                },
                color: l.color
            }
        })
        const rmPtCb = ()=>{
            if(activePt.value){
                saveStore.removePt(activePt.value.id);
                setStaNameRects(activePt.value.id, false);
            }
            activePt.value = undefined
            activeLine.value = undefined
            cursorPos.value = undefined
            setOpsPos(false)
            pointMutated.value(relatedLineIds, [])
            pointlessLineScan()
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
            [{
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
            }],
            [...rmFromLines],
            [...addToLines]
        ]
    }
    function setOpsForLine(){
        const insertPtCb = ()=>{
            if(cursorPos.value){
                if(!activeLine.value)
                    return;
                let cur:Coord = [...cursorPos.value]
                const gridSnapped = snapGrid(cur)
                if(gridSnapped){
                    cur = gridSnapped
                }
                const id = saveStore.insertPtOnLine(activeLine.value.id, cursorOnLineAfterPtIdx.value, cur, cursorDir.value)
                pointMutated.value([activeLine.value.id], [])
                if(id!==undefined){
                    activePt.value = saveStore.getPtById(id)
                    setOpsForPt()
                }
            }
        }
        opsStore.btns = [[
            {
                type:'addPt',
                cb: insertPtCb
            }
        ]]
    }

    function delLine(lineId:number, suppressRender?:boolean){
        if(!saveStore.save)
            return
        const idx = saveStore.save.lines.findIndex(x=>x.id==lineId)
        if(idx >= 0)
            saveStore.save.lines.splice(idx, 1)
        setLinesFormalPts(lineId, false)
        if(!suppressRender)
            pointMutated.value([],[])
    }
    function createLine(){
        if(!saveStore.save)
            return
        const viewCenter = scaler.getCenterOffset()
        let viewCenterCoord:Coord|undefined = [viewCenter.x, viewCenter.y]
        viewCenterCoord = translateFromOffset(viewCenterCoord)
        if(!viewCenterCoord)
            return
        const pt1Pos:Coord = [...viewCenterCoord]
        const pt2Pos:Coord = [...viewCenterCoord]
        pt1Pos[0] -= 50
        pt2Pos[0] += 50
        ensureSpaceForNewPt(pt1Pos)
        ensureSpaceForNewPt(pt2Pos)
        const pt1:ControlPoint = {
            id: saveStore.getNewId(),
            pos: pt1Pos,
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta
        }
        const pt2:ControlPoint = {
            id: saveStore.getNewId(),
            pos: pt2Pos,
            dir: ControlPointDir.vertical,
            sta: ControlPointSta.sta
        }
        saveStore.save.points.push(pt1, pt2)
        const newLine = {
            id: saveStore.getNewId(),
            pts: [pt1.id, pt2.id],
            name: '新线路',
            nameSub: 'NewLine',
            color: "#ff0000"
        }
        saveStore.save.lines.push(newLine)
        pointMutated.value([newLine.id], [pt1.id, pt2.id])
    }
    function lineColorChanged(){
        pointMutated.value([],[])
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
    function pointlessLineScan(){
        if(!saveStore.save)
            return
        const needRemoveIds:number[] = []
        saveStore.save.lines.forEach(l=>{
            if(l.pts.length<2){
                needRemoveIds.push(l.id)
            }
        })
        needRemoveIds.forEach(lineId=>delLine(lineId, true))
        pointMutated.value([],[])
    }
    function ensureSpaceForNewPt(coord:Coord){
        const original:Coord = [...coord]
        let safty = 16
        let ok = false
        let offset = 20;
        let offsetSgn = 1
        while(!ok){
            ok = !onPt(coord)
            if(ok)
                ok = !onStaName(coord)
            if(ok)
                ok = onLine(coord).length == 0
            if(!ok){
                coord[1] = original[1] + offset*offsetSgn
                offsetSgn *= -1
                if(offsetSgn > 0)
                    offset += 40
                console.log(coord)
            }
            safty--;
            if(safty<=0)
                break;
        }
    }
    
    return { 
        init, activePt, activePtType, activePtNameSnapped,
        activeLine, cursorPos, movingPoint, movedPoint,
        cvsFrame, cvsCont, cvsWidth, cvsHeight, getDisplayRatio,
        pointMutated, rescaled,
        delLine, createLine, lineColorChanged
    }
})