import { useSaveStore } from "@/models/stores/saveStore";
import { useCvs } from "../common/cvs";
import { useLineCvsWorker } from "../workers/lineCvsWorker";
import { useEnvStore } from "@/models/stores/envStore";
import { usePointCvsWorker } from "../workers/pointCvsWorker";
import { useRayCvsWorker } from "../workers/rayCvsWorker";
import { useSnapStore } from "@/models/stores/snapStore";
import { useStaNameCvsWorker } from "../workers/staNameCvsWorker";
import { useLineExtendCvsWorker } from "../workers/lineExtendCvsWorker";
import { useLineExtendStore } from "@/models/stores/saveDerived/saveDerivedDerived/lineExtendStore";
import { useCursorCvsWorker } from "../workers/cursorCvsWorker";
import { SgnCoord } from "@/models/coord";
import { defineStore, storeToRefs } from "pinia";
import { useEmphasizeCvsWorker } from "../workers/emphasizeCvsWorker";
import { useTextTagCvsWorker } from "../workers/textTagCvsWorker";
import { useDiscardAreaCvsWorker } from "../workers/discardAreaCvsWorker";
import { coordAngle, coordSub } from "@/utils/coordUtils/coordMath";
import { numberCmpEpsilon } from "@/utils/consts";
import { ControlPointDir } from "@/models/save";

export const useActiveCvsDispatcher = defineStore('activeCvsDispatcher', ()=>{
    const saveStore = useSaveStore()
    const envStore = useEnvStore()
    const snapStore = useSnapStore()
    const lineExtendStore = useLineExtendStore()
    const canvasIdPrefix = 'active'
    const { getCtx } = useCvs(canvasIdPrefix)
    const { renderSegsAroundActivePt, renderLine } = useLineCvsWorker()
    const { renderSomePoints, renderLinePoints, renderPointById } = usePointCvsWorker()
    const { renderRay } = useRayCvsWorker()
    const { renderPtNameById } = useStaNameCvsWorker()
    const { renderLineExtend } = useLineExtendCvsWorker()
    const { renderCursor } = useCursorCvsWorker()
    const { renderEmphasizesForRingLines } = useEmphasizeCvsWorker()
    const { renderOneTextTag } = useTextTagCvsWorker()
    const { renderDiscardArea } = useDiscardAreaCvsWorker()

    const { getActivePtOpsAvoidance } = storeToRefs(envStore)
    getActivePtOpsAvoidance.value = renderActiveCvs

    function renderActiveCvs(){
        //该函数应被设置为每x毫秒执行一次
        const ctx = getCtx(envStore.somethingActive);
        if(envStore.activeLine){
            renderLine(ctx, envStore.activeLine)
            renderLinePoints(ctx, envStore.activeLine)
            renderEmphasizesForRingLines(ctx, [envStore.activeLine])
        }
        let lineExtendWays:SgnCoord[] = []
        lineExtendStore.clearLineExtendBtns()
        const activePtId = envStore.activePt?.id
        if(activePtId){
            autoDirForNewExtended()
            const activePtBelongLines = saveStore.getLinesByPt(activePtId)
            if(activePtBelongLines.length>0){
                const segRenderRes = renderSegsAroundActivePt(ctx)
                lineExtendStore.refreshLineExtend(activePtId, segRenderRes.formalizedSegs)
                lineExtendWays = lineExtendStore.getLineExtendWays()
                if(!envStore.movingPoint || !envStore.movedPoint){
                    renderLineExtend(ctx)
                }
                renderSomePoints(ctx, segRenderRes.relatedPts, activePtId)
            }else{
                renderPointById(ctx, activePtId, true)
            }
            if(envStore.activePtType=='body'){
                renderPtNameById(ctx, activePtId, true)
            }else if(envStore.activePtType=='name'){
                let markRoot:'free'|'snapVague'|'snapAccu' = 'free'
                if(envStore.activePtNameSnapped == 'accu')
                    markRoot = 'snapAccu'
                else if(envStore.activePtNameSnapped == 'vague')
                    markRoot = 'snapVague'
                renderPtNameById(ctx, activePtId, true, markRoot)
            }
        }
        if(envStore.movingPoint && envStore.activePtType=='body' 
            && snapStore.snapLines && snapStore.snapLinesForPt == activePtId)
        {
            const ls = snapStore.snapLines
            ls.forEach(l=>{
                renderRay(ctx, l.source, l.way)
            })
        }
        if(envStore.activeTextTag){
            renderOneTextTag(ctx, envStore.activeTextTag)
        }
        renderCursor(ctx)
        renderDiscardArea(ctx)
        return lineExtendWays
    }
    
    const _45SubEps = Math.PI/4 - numberCmpEpsilon
    const _90AndEps = Math.PI/2 + numberCmpEpsilon
    /** 正在把“延长按钮拖出来的点”拖动时，其方向会智能自动调整 */
    function autoDirForNewExtended(){
        if(!envStore.movingExtendedPointOriginated || !envStore.activePt){
            //如果不是正在移动“延长按钮拖出来的点”，恢复原状
            snapStore.snapNeighborExtendsOnlySameDir = false
            return
        }
        //如果当前正在移动“延长按钮拖出来的点”，那么将线中相邻延长线snap设为“必须同方向控制点”，否则在接近45度时会鬼畜
        snapStore.snapNeighborExtendsOnlySameDir = true
        const ori = envStore.movingExtendedPointOriginated
        const act = envStore.activePt
        const currentWay = coordSub(act.pos, ori.from.pos)
        const angle = Math.abs(coordAngle(currentWay, ori.btnWay))
        let shouldSame = true
        if(angle < numberCmpEpsilon){ }     //0度时，保持方向一样
        else if(angle < _45SubEps)
            shouldSame = false              //小于45度时，变方向
        else if(angle > _90AndEps)          //（45-90度时保持方向一样）
            shouldSame = false              //大于90度时，变方向
        if(ori.from.dir === ControlPointDir.vertical){
            if(shouldSame)
                envStore.activePt.dir = ControlPointDir.vertical
            else
                envStore.activePt.dir = ControlPointDir.incline
        }else{
            if(shouldSame)
                envStore.activePt.dir = ControlPointDir.incline
            else
                envStore.activePt.dir = ControlPointDir.vertical
        }
    }
    return { renderActiveCvs, canvasIdPrefix }
})