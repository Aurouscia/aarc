import { defineStore, storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useSaveStore } from "./saveStore";
import { Coord, SgnCoord } from "../coord";
import { listenPureClick } from "@/utils/eventUtils/pureClick";
import { eventClientCoord } from "@/utils/eventUtils/eventClientCoord";
import { OpsBtn, useOpsStore } from "./opsStore";
import { ColorPreset, ControlPoint, ControlPointDir, ControlPointSta, Line, LineType, TextTag } from "../save";
import { useSnapStore } from "./snapStore";
import { coordAdd, coordSub } from "@/utils/coordUtils/coordMath";
import { useNameEditStore } from "./nameEditStore";
import { useFormalizedLineStore } from "./saveDerived/formalizedLineStore";
import { useStaNameRectStore } from "./saveDerived/staNameRectStore";
import { useStaClusterStore } from "./saveDerived/staClusterStore";
import { useLineExtendStore } from "./saveDerived/saveDerivedDerived/lineExtendStore";
import { useOnDetectStore } from "./saveDerived/saveDerivedDerived/onDetectStore";
import { useCvsFrameStore } from "./cvsFrameStore";
import { useDiscardAreaStore } from "./discardAreaStore";
import { useTextTagEditStore } from "./textTagEditStore";
import rfdc from "rfdc";

export const useEnvStore = defineStore('env', ()=>{
    const saveStore = useSaveStore();
    const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
    const opsStore = useOpsStore();
    const activePt = ref<ControlPoint>()
    const movingPoint = ref<boolean>(false)
    const movedPoint = ref<boolean>(false)
    const movingExtendedPointOriginated = ref<{from:ControlPoint, btnWay:SgnCoord}>()
    const activePtType = ref<'body'|'name'>('body')
    const activePtNameGrabbedAt = ref<Coord>([0,0])
    const activePtNameSnapped = ref<'no'|'vague'|'accu'>('no')
    const nameEditStore = useNameEditStore()
    const textTagEditStore = useTextTagEditStore()
    const staClusterStore = useStaClusterStore()
    const activeLine = ref<Line>()
    const activeTextTag = ref<TextTag>()
    const movingTextTag = ref<boolean>(false)
    const movedTextTag = ref<boolean>(false)
    const activeTextTagGrabbedAt = ref<Coord>([0,0])
    const viewMoveLocked = computed<boolean>(()=>movingPoint.value || movingTextTag.value)
    const cursorPos = ref<Coord>()
    const cursorDir = ref<ControlPointDir>(ControlPointDir.vertical)
    const cursorOnLineAfterPtIdx = ref<number>(-1)
    const cvsFrameStore = useCvsFrameStore()
    const { cvsFrame, cvsCont } = storeToRefs(cvsFrameStore)
    const { initScaler, translateFromClient, translateToClient,
        translateFromOffset, getViewCenterOffset, getDisplayRatio } = cvsFrameStore
    const rerender = ref<(changedLines?:number[], staNameMoved?:number[])=>void>(()=>{});
    const rescaled = ref<(()=>void)[]>([])
    const getActivePtOpsAvoidance = ref<()=>SgnCoord[]>(()=>[])
    const snapStore = useSnapStore()
    const { snap, snapName, snapNameStatus, snapGrid } = snapStore
    const { setLinesFormalPts } = useFormalizedLineStore()
    const { setStaNameRects } = useStaNameRectStore()
    const { onPt, onLine, onStaName, onLineExtendBtn, onTextTag } = useOnDetectStore()
    const { removeLineExtendBtn } = useLineExtendStore()
    const discardAreaStore = useDiscardAreaStore()
    const deepClone = rfdc()
    function init(){
        if(!cvsCont.value || !cvsFrame.value)
            return
        initScaler(viewRescaleHandler, viewMoveHandler, viewMoveLocked)
        nameEditStore.nameInputFocusHandler = ()=>{setOpsPos(false)}
        listenPureClick(cvsCont.value, pureClickHandler)
        cvsCont.value.addEventListener('mousedown', moveStartHandler)
        cvsCont.value.addEventListener('touchstart', moveStartHandler)
        cvsCont.value.addEventListener('mousemove', movingHandler)
        cvsCont.value.addEventListener('touchmove', movingHandler)
        cvsCont.value.addEventListener('mouseup', moveEndHandler)
        cvsCont.value.addEventListener('touchend', moveEndHandler)
    }
    let rescaleSteppedLastCall = 0
    function viewRescaleHandler(){
        setOpsPos(false)
        //限制50ms一次
        window.setTimeout(()=>{
            const now = Date.now()
            if(now - rescaleSteppedLastCall < 50)
                return
            rescaleSteppedLastCall = now
            rescaled.value.forEach(f=>f())
        })
    }
    function viewMoveHandler(){
        setOpsPos(false)
    }
    
    const somethingActive = computed<boolean>(()=>{
        return !!activePt.value || !!activeLine.value || !!activeTextTag.value})
    function cancelActive(){
        activePt.value = undefined
        activeLine.value = undefined
        activeTextTag.value = undefined
        cursorPos.value = undefined
        movedPoint.value = false
        movedTextTag.value = false
    }
    function endEveryEditing(exceptName?:boolean){
        //结束editing状态，将edited重置回false
        if(!exceptName)
            nameEditStore.endEditing()
        textTagEditStore.endEditing()
        nameEditStore.edited = false
        textTagEditStore.edited = false
    }
    function pureClickHandler(clientCord:Coord, isRightBtn?:boolean){
        const coord = translateFromClient(clientCord);
        if(!coord)
            return

        snapStore.snapInterPtTargets = undefined
        //根据当前状态判断是否需要重新渲染主画布
        let rerenderParamLineIds:number[] = []
        let rerenderParamPtIds:number[] = []
        let mergeKept:ControlPoint|undefined = undefined
        if(activePt.value){
            //尝试合并控制点
            const tryMergeRes = saveStore.tryMergePt(activePt.value.id)
            if(tryMergeRes){
                const changedLines = tryMergeRes.mutatedLines.map(x=>x.id)
                const movedStaNames = [tryMergeRes.mergedWithPt.id, activePt.value.id]
                rerenderParamLineIds.push(...changedLines)
                rerenderParamPtIds.push(...movedStaNames)
                mergeKept = tryMergeRes.keptPt //如果成功合并了，记录下合并中保留了哪一个
            }
        }
        if(nameEditStore.edited && activePt.value?.id){
            rerenderParamPtIds.push(activePt.value.id)
        }
        if(movedPoint.value && activePt.value?.id){
            const lines = saveStore.getLinesByPt(activePt.value.id)
            rerenderParamLineIds.push(...lines.map(x=>x.id))
            rerenderParamPtIds.push(activePt.value.id)
        }
        //更新车站团
        if(mergeKept){
            staClusterStore.updateClustersBecauseOf(mergeKept)
        }else if(movedPoint.value && activePt.value){
            staClusterStore.updateClustersBecauseOf(activePt.value)
        }
        //如果有需要重新渲染的线/点、或移动过文本标签，那么重新渲染
        if(rerenderParamLineIds.length>0 || rerenderParamPtIds.length>0 
                || movedTextTag.value || textTagEditStore.edited){
            //重新渲染的同时，更新了相关staNameRect和FormalPts，确保接下来的点击判断使用最新数据
            rerender.value(rerenderParamLineIds, rerenderParamPtIds)
        }

        //取消所有状态
        const activePtIdJustNow = activePt.value?.id
        cancelActive()


        //判断是否在站名上
        const staName = !isRightBtn && onStaName(coord)
        if(staName){
            //点到站名上了
            endEveryEditing(true)
            activePt.value = saveStore.getPtById(staName.id)
            activePtType.value = 'name'
            const namingPtChanged = activePtIdJustNow !== staName.id
            if(namingPtChanged)
                nameEditStore.startEditing(staName.id)
            else if(opsStore.showingOps && nameEditStore.editing){
                //如果正在命名的车站没变，而且菜单显示着，则保留站名编辑
            }else{
                //如果正在命名的车站没变，而且菜单未显示，则收起站名编辑
                nameEditStore.toggleEditing(staName.id)
            }
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
        }

        const textTagMatch = onTextTag(coord);
        if(textTagMatch){
            activeTextTag.value = textTagMatch
            setOpsPos(false)
            endEveryEditing()
            textTagEditStore.startEditing(textTagMatch.id)
            return
        }

        //判断是否在点上
        const pt = onPt(coord, true)
        const activePtChanged = activePtIdJustNow !== pt?.id
        if(pt){
            //点到点上了
            endEveryEditing(true)
            activePt.value = pt
            activePtType.value = 'body'
            cursorPos.value = [...pt.pos]
            if(isRightBtn){
                //右键点击控制点，切换其方向
                if(pt.dir===ControlPointDir.incline)
                    pt.dir = ControlPointDir.vertical
                else
                    pt.dir = ControlPointDir.incline
                movedPoint.value = true
            }else{
                if(!opsStore.clientPos || activePtChanged){
                    //菜单不在时，弹出菜单
                    opsStore.atAvoidWays = getActivePtOpsAvoidance.value()
                    setOpsPos(pt.pos)
                    setOpsForPt()
                    nameEditStore.startEditing(pt.id)
                }else if(!activePtChanged){
                    //菜单已在同一个点上时，再次点击使其收起
                    setOpsPos(false)
                    nameEditStore.endEditing()
                }
            }
            return
        }
        
        //判断是否在线上
        //如果已经移动过点，这时formalPts还未更新，不应该进行点击线路判断，直接视为点击空白处
        const lineMatches = !isRightBtn && onLine(coord);
        if(lineMatches && lineMatches.length>0){
            //点到线上了
            const lineMatch = lineMatches[0]
            activeLine.value = saveStore.getLineById(lineMatch.lineId)
            cursorPos.value = [...lineMatch.alignedPos]
            cursorOnLineAfterPtIdx.value = lineMatch.afterPtIdx
            cursorDir.value = lineMatch.dir
            setOpsPos(lineMatch.alignedPos)
            setOpsForLine()
            endEveryEditing()
            return
        }

        //点击空白位置
        setOpsPos(false)
        activePtNameSnapped.value = 'no'
        endEveryEditing()
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
        if(activeTextTag.value){
            const tag = onTextTag(coord)
            if(tag && tag === activeTextTag.value){
                movingTextTag.value = true
                const tagGlobalPos = activeTextTag.value.pos
                activeTextTagGrabbedAt.value = coordSub(coord, tagGlobalPos)
            }
        }
        //判断是否在线路延长按钮上
        const lineExtend = onLineExtendBtn(coord)
        if (lineExtend && activePt.value) {
            removeLineExtendBtn(lineExtend)
            movingExtendedPointOriginated.value = {
                btnWay: [...lineExtend.way],
                from: activePt.value
            }
            const newPtId = saveStore.insertNewPtToLine(
                lineExtend.lineId, lineExtend.at, lineExtend.btnPos, lineExtend.btnDir)
            if (newPtId) {
                if(nameEditStore.edited)
                    rerender.value([], [activePt.value.id])
                activePt.value = saveStore.getPtById(newPtId)
                if (activePt.value) {
                    cursorPos.value = [...activePt.value.pos]
                    setOpsPos(false)
                    activePtType.value = 'body'
                    movedPoint.value = true
                    movingPoint.value = true
                    nameEditStore.startEditing(newPtId)
                }
            }
        }else{
            movingExtendedPointOriginated.value = undefined
        }
    }
    function movingHandler(e:MouseEvent|TouchEvent){
        if(movingPoint.value){
            setOpsPos(false)
            const clientCoord = eventClientCoord(e)
            if(!clientCoord)
                return;
            const nameEditorHeight = nameEditStore.getEditorDivEffectiveHeight()
            if(clientCoord[1] < nameEditorHeight+10){
                nameEditStore.endEditing()
            }
            const coord = translateFromClient(clientCoord);
            let pt = activePt.value
            if(pt && coord){
                if(activePtType.value=='body'){
                    discardAreaStore.discardStatus(clientCoord)
                    pt.pos = coord;
                    const snapRes = snap(pt)
                    if(snapRes)
                        pt.pos = snapRes
                    cursorPos.value = coord
                }else if(activePtType.value=='name'){
                    discardAreaStore.discardStatus(clientCoord)
                    const transferRes = staClusterStore.tryTransferStaNameWithinCluster(pt)
                    if(transferRes){
                        pt.name = undefined
                        pt.nameS = undefined 
                        pt.nameP = undefined
                        setStaNameRects(pt.id, undefined)
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
        else if(movingTextTag.value && activeTextTag.value){
            setOpsPos(false)
            const clientCoord = eventClientCoord(e)
            if(!clientCoord)
                return;
            const textTagEditorHeight = textTagEditStore.getEditorDivEffectiveHeight()
            if(clientCoord[1] < textTagEditorHeight+20){
                textTagEditStore.endEditing()
            }
            const coord = translateFromClient(clientCoord)
            if(!coord || !clientCoord)
                return;
            discardAreaStore.discardStatus(clientCoord)
            let setToGlobalPos = coordSub(coord, activeTextTagGrabbedAt.value)
            const snapGridRes = snapGrid(setToGlobalPos, undefined, true)
            if(snapGridRes){
                setToGlobalPos = snapGridRes
            }
            activeTextTag.value.pos = setToGlobalPos
            movedTextTag.value = true
        }
    }
    function moveEndHandler(){
        //手指离开屏幕时，touches为空数组，无法获取位置
        movingPoint.value = false
        activePtNameGrabbedAt.value = [0,0]
        movingTextTag.value = false
        activeTextTagGrabbedAt.value = [0,0]
        if(movingExtendedPointOriginated.value){
            const extendFrom = movingExtendedPointOriginated.value.from
            staClusterStore.updateClustersBecauseOf(extendFrom)
            const mergeRes = saveStore.tryMergePt(extendFrom.id)
            if(mergeRes){
                rerender.value([], [])
            }
        }
        movingExtendedPointOriginated.value = undefined
        
        if(discardAreaStore.discarding=='active'){
            if(activeTextTag.value){
                saveStore.removeTextTag(activeTextTag.value.id)
                activeTextTag.value = undefined
            }
            else if(activePt.value){
                if(activePtType.value == 'body'){
                    saveStore.removePt(activePt.value.id)
                    activePt.value = undefined
                }else if(activePtType.value == 'name'){
                    activePt.value.name = undefined
                    activePt.value.nameS = undefined
                    activePt.value.nameP = undefined
                    saveStore.disposedStaNameOf(activePt.value.id)
                    activePt.value = undefined
                }
            }
            rerender.value([], [])
        }
        discardAreaStore.resetDiscarding()
    }

    function setOpsPos(coord:Coord|false){
        if(!coord){
            opsStore.clientPos = undefined
            opsStore.btns = []
            return
        }
        const clientCoord = translateToClient(coord)
        if(!clientCoord)
            return
        opsStore.clientPos = clientCoord
    }
    function setOpsForPt(){
        const pt = activePt.value;
        if(!pt){
            opsStore.btns = []
            return;
        }
        const relatedLines = saveStore.getLinesByPt(pt.id)
        const relatedLineIds = relatedLines.map(line=>line.id)
        const relatedLineTypes = relatedLines.map(line=>line.type)
        const isLineTypeWithoutSta = saveStore.isLineTypeWithoutSta(relatedLineTypes)
        const onLineRes = onLine(pt.pos, relatedLineIds)
        const addToLines = onLineRes.map<OpsBtn>(l=>{
            const lineName = saveStore.getLineById(l.lineId)?.name
            return{
                cb:()=>{
                    saveStore.insertPtToLine(pt.id, l.lineId, l.afterPtIdx, l.alignedPos, l.dir);
                    rerender.value([l.lineId, ...relatedLineIds], [pt.id])
                    setOpsForPt()
                },
                color: saveStore.getLineActualColorById(l.lineId),
                text:'加入',
                textSub:lineName
            }
        })
        const rmFromLines = relatedLines.map(l=>{
            return{
                cb:()=>{
                    saveStore.removePtFromLine(pt.id, l.id);
                    rerender.value([l.id, ...relatedLineIds], [])
                    pointlessLineScan()
                    setOpsForPt()
                    activeLine.value = undefined
                },
                color: saveStore.getLineActualColor(l),
                text:'脱离',
                textSub: l.name
            }
        })
        const rmPtCb = ()=>{
            if(activePt.value){
                saveStore.removePt(activePt.value.id);
                setStaNameRects(activePt.value.id, undefined);
            }
            activePt.value = undefined
            activeLine.value = undefined
            cursorPos.value = undefined
            setOpsPos(false)
            rerender.value(relatedLineIds, [])
            pointlessLineScan()
        }
        const swDirCb = ()=>{
            if(pt){
                if(pt.dir == ControlPointDir.incline)
                    pt.dir = ControlPointDir.vertical
                else
                    pt.dir = ControlPointDir.incline
                movedPoint.value = true
            }
        }
        const swSta = ()=>{
            if(pt){
                if(pt.sta == ControlPointSta.plain)
                    pt.sta = ControlPointSta.sta
                else
                    pt.sta = ControlPointSta.plain
                movedPoint.value = true
            }
        }
        let firstCol:OpsBtn[] = [{
                cb:swDirCb,
                text:'旋转'
            },{
                cb:rmPtCb,
                text:'移除'
            }]
        if(!isLineTypeWithoutSta){
            firstCol.splice(1, 0, {
                cb:swSta,
                text:'切换',
                textSub:'是否显示'
            })
        }
        opsStore.btns = [
            [...firstCol],
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
                const id = saveStore.insertNewPtToLine(activeLine.value.id, cursorOnLineAfterPtIdx.value, cur, cursorDir.value)
                rerender.value([activeLine.value.id], [])
                if(id!==undefined){
                    activePt.value = saveStore.getPtById(id)
                    activeLine.value = undefined
                    setOpsForPt()
                    nameEditStore.startEditing(id)
                }
            }
        }
        const createTagForLine = ()=>{
            if(activeLine.value?.id){
                const lineId = activeLine.value.id
                activeLine.value = undefined
                createTextTag(lineId)
            }
        }
        opsStore.btns = [[
            {
                cb: insertPtCb,
                text:'插入'
            },
            {
                cb: createTagForLine,
                text:'标签'
            }
        ]]
    }

    function delLine(lineId:number, suppressRender:boolean = false, delWithSta:boolean = false){
        if(!saveStore.save)
            return
        const idx = saveStore.save.lines.findIndex(x=>x.id==lineId)
        if(idx >= 0){
            if(delWithSta){
                const pts = saveStore.save.lines.at(idx)?.pts
                if(pts){
                    for(const pt of pts){
                        const belongLines = saveStore.getLinesByPt(pt)
                        if(belongLines.length<=1){
                            const ptIdx = saveStore.save.points.findIndex(x=>x.id == pt)
                            if(ptIdx>=0){
                                saveStore.deletedPoint(pt)
                                saveStore.save.points.splice(ptIdx, 1)
                            }
                        }
                    }
                }
            }
            saveStore.save.lines.splice(idx, 1)
        }
        setLinesFormalPts(lineId, undefined)
        if(!suppressRender)
            rerender.value([],[])
    }
    function createLine(type:LineType){
        if(!saveStore.save)
            return
        const viewCenter = getViewCenterOffset()
        let viewCenterCoord:Coord|undefined = [viewCenter.x, viewCenter.y]
        viewCenterCoord = translateFromOffset(viewCenterCoord)
        if(!viewCenterCoord)
            return
        ensureCoordInCanvas(viewCenterCoord)
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
        let newLine:Line|undefined = undefined
        if(type==LineType.common){
            newLine = {
                id: saveStore.getNewId(),
                pts: [pt1.id, pt2.id],
                name: '',
                nameSub: '',
                color: "#ff0000",
                type: LineType.common
            }
        }else if(type==LineType.terrain){
            newLine = {
                id: saveStore.getNewId(),
                pts: [pt1.id, pt2.id],
                name: '',
                nameSub: '',
                color: "#000000",
                type: LineType.terrain,
                colorPre: ColorPreset.water
            }
        }
        if(newLine){
            saveStore.createNewLine(newLine)
            rerender.value([newLine.id], [pt1.id, pt2.id])
        }
    }
    function lineInfoChanged(line:Line, widthChanged?:boolean){
        if(widthChanged){
            for(const ptId of line.pts){
                const pt = saveStore.getPtById(ptId)
                if(pt)
                    staClusterStore.updateClustersBecauseOf(pt)
            }
        }
        rerender.value([], line.pts)
    }

    function createTextTag(forLine?:number){
        const vco = getViewCenterOffset()
        let viewCenterCoord:Coord|undefined = [vco.x, vco.y]
        viewCenterCoord = translateFromOffset(viewCenterCoord)
        if(!viewCenterCoord)
            return
        ensureCoordInCanvas(viewCenterCoord)
        const newTag:TextTag = {
            id: saveStore.getNewId(),
            forId: forLine,
            pos: viewCenterCoord
        }
        saveStore.save?.textTags.push(newTag)
        movedTextTag.value = true
        activeTextTag.value = newTag
        if(!forLine)
            textTagEditStore.startEditing(newTag.id)
    }
    function duplicateTextTag(){
        const textTag = activeTextTag.value
        if(!textTag)
            return
        const newTextTag = deepClone(textTag)
        newTextTag.id = saveStore.getNewId()
        newTextTag.pos[1] += 120
        saveStore.save?.textTags.push(newTextTag)
        movedTextTag.value = true
        activeTextTag.value = newTextTag
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
        if(needRemoveIds.length>0)
            rerender.value([],[])
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
            }
            safty--;
            if(safty<=0)
                break;
        }
    }
    function ensureCoordInCanvas(coord:Coord, margin = 100){
        if(coord[1] >= cvsHeight.value - margin){
            coord[1] = cvsHeight.value - margin
        }
        if(coord[0] >= cvsWidth.value - margin){
            coord[0] = cvsWidth.value - margin
        }
    }
    
    return { 
        init, activePt, activePtType, activePtNameSnapped,
        activeLine, activeTextTag, somethingActive,
        cursorPos, movingPoint, movedPoint, movingExtendedPointOriginated, movingTextTag,
        cvsWidth, cvsHeight, getDisplayRatio,
        rerender, rescaled, getActivePtOpsAvoidance,
        delLine, createLine, lineInfoChanged,
        createTextTag, duplicateTextTag
    }
})