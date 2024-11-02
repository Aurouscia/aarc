import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useSaveStore } from "./saveStore";
import { Scaler } from "@/utils/eventUtils/scaler";
import { Coord } from "../coord";
import { coordDistSq } from "@/utils/coordUtils/coordDist";
import { listenPureClick } from "@/utils/eventUtils/pureClick";
import { eventClientCoord } from "@/utils/eventUtils/eventClientCoord";
import { coordOnLineOfFormalPts } from "@/utils/coordUtils/coordOnLine";
import { OpsBtn, OpsBtnType, useOpsStore } from "./opsStore";
import { ControlPoint, ControlPointDir, ControlPointSta, Line } from "../save";
import { useSnapStore } from "./snapStore";
import { rectInside } from "@/utils/coordUtils/coordInsideRect";
import { coordAdd, coordSub } from "@/utils/coordUtils/coordMath";
import { useNameEditStore } from "./nameEditStore";
import { useConfigStore } from "./configStore";
import { useFormalizedLineStore } from "./saveDerived/formalizedLineStore";
import { useStaNameRectStore } from "./saveDerived/staNameRectStore";
import { useStaClusterStore } from "./saveDerived/staClusterStore";

export const useEnvStore = defineStore('env', ()=>{
    const movingPoint = ref<boolean>(false)
    const movedPoint = ref<boolean>(false)
    const saveStore = useSaveStore();
    const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
    const cs = useConfigStore()
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
    const pointMutated = ref<(changedLines:number[], staNameMoved:number[])=>void>(()=>{});
    const rescaled = ref<(()=>void)[]>([])
    const { snap, snapName, snapNameStatus } = useSnapStore()
    const { enumerateFormalizedLines } = useFormalizedLineStore()
    const { enumerateStaNameRects, setStaNameRects } = useStaNameRectStore()
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
        const pt = onPt(coord)
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
                const pt = onPt(coord)
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

    function onPt(c:Coord){
        return saveStore.save?.points.find(p=>{
            const distSq = coordDistSq(p.pos, c)
            return distSq < cs.clickPtThrsSq
        })
    }
    function onLine(c:Coord, exceptLines:number[] = []){
        const res:{lineId:number, alignedPos:Coord, afterPtIdx:number, dir:ControlPointDir}[] = []
        enumerateFormalizedLines(line=>{
            if(exceptLines.includes(line.lineId))
                return;
            const onLineRes = coordOnLineOfFormalPts(c, line.pts, {
                clickLineThrs: cs.config.clickLineThrs,
                clickLineThrsSq: cs.clickLineThrsSq,
                clickLineThrs_sqrt2_sq: cs.clickLineThrs_sqrt2_sq
            })
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
        let onPt:ControlPoint|undefined;
        enumerateStaNameRects(rect=>{
            if(rectInside(rect.rect, c)){
                const pt = saveStore.save?.points.find(pt => pt.id == rect.ptId)
                onPt = pt;
                return;
            }
        })
        return onPt;
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
                if(!activeLine.value)
                    return;
                const id = saveStore.insertPtOnLine(activeLine.value.id, cursorOnLineAfterPtIdx.value, cursorPos.value, cursorDir.value)
                pointMutated.value([activeLine.value.id], [])
                if(id!==undefined){
                    activePt.value = saveStore.getPtById(id)
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
        init, activePt, activePtType, activePtNameSnapped,
        activeLine, cursorPos, movingPoint,
        cvsFrame, cvsCont, cvsWidth, cvsHeight, getDisplayRatio,
        pointMutated, rescaled
    }
})