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
import { ControlPointDir, Line } from "@/models/save";
import { usePointLinkStore } from "@/models/stores/pointLinkStore";
import { useSelectionCvsWorker } from "../workers/selectionCvsWorker";
import { useSelectionStore } from "@/models/stores/selectionStore";
import { computed } from "vue";

export const useActiveCvsDispatcher = defineStore('activeCvsDispatcher', ()=>{
    const saveStore = useSaveStore()
    const envStore = useEnvStore()
    const snapStore = useSnapStore()
    const lineExtendStore = useLineExtendStore()
    const pointLinkStore = usePointLinkStore()
    const selectionStore = useSelectionStore()
    const canvasIdPrefix = 'active'
    const { getCtx } = useCvs(canvasIdPrefix)
    const { renderSegsAroundActivePt, renderLine } = useLineCvsWorker()
    const { renderSomePoints, renderLinePoints, renderPointById, renderInterPtSnapTargets } = usePointCvsWorker()
    const { renderRay } = useRayCvsWorker()
    const { renderPtNameById } = useStaNameCvsWorker()
    const { renderLineExtend } = useLineExtendCvsWorker()
    const { renderCursor } = useCursorCvsWorker()
    const { renderEmphasizesForRingLines } = useEmphasizeCvsWorker()
    const { renderOneTextTag } = useTextTagCvsWorker()
    const { renderDiscardArea } = useDiscardAreaCvsWorker()
    const { renderSelection } = useSelectionCvsWorker()

    const { getActivePtOpsAvoidance } = storeToRefs(envStore)
    getActivePtOpsAvoidance.value = renderActiveCvs
    let cvsCleared = true

    const noNeedActiveCvs = computed(()=>{
        const sel = selectionStore.enabled || selectionStore.selected.size > 0
        return !sel && !envStore.somethingActive && !pointLinkStore.isCreating
    })

    function renderActiveCvs(){
        //该函数应被设置为每x毫秒执行一次
        if(noNeedActiveCvs.value){
            if(!cvsCleared){
                getCtx()
                cvsCleared = true
            }
            return []
        }
        const ctx = getCtx();
        cvsCleared = false
        let line:Line|undefined = undefined
        if(envStore.activeLine || envStore.activeTextTag?.forId){
            line = envStore.activeLine
            if(!line){
                line = saveStore.getLineById(envStore.activeTextTag?.forId ?? 0)
            }
            if(line){
                renderLine(ctx, line)
                renderLinePoints(ctx, line)
                renderEmphasizesForRingLines(ctx, [line])
            }
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
                renderInterPtSnapTargets(ctx)
            }else if(envStore.activePtType=='name'){
                let markRoot:'free'|'snapVague'|'snapAccu' = 'free'
                if(envStore.activePtNameSnapped == 'accu')
                    markRoot = 'snapAccu'
                else if(envStore.activePtNameSnapped == 'vague')
                    markRoot = 'snapVague'
                renderPtNameById(ctx, activePtId, true, markRoot)
            }
        }
        const shouldRenderSnapLinesBecauseOfPt 
            = envStore.movingPoint && envStore.activePt && envStore.activePtType=='body'
        const shouldRenderSnapLinesBecauseOfTextTag
            = envStore.movingTextTag && envStore.activeTextTag
        const shouldRenderSnapLines = shouldRenderSnapLinesBecauseOfPt || shouldRenderSnapLinesBecauseOfTextTag
        
        if(shouldRenderSnapLines && snapStore.snapLines)
        {
            const ls = snapStore.snapLines
            ls.forEach(l=>{
                renderRay(ctx, l.source, l.way)
            })
        }
        if(line){
            //渲染了某线路（可能是由于选中其本身、或选中其标签），则渲染其所有标签
            const forItTags = saveStore.save?.textTags.filter(x=>x.forId === line.id)
            forItTags?.forEach(x=>{
                const strokeRect = x.id === envStore.activeTextTag?.id
                renderOneTextTag(ctx, x, strokeRect)
            })
        }
        else if(envStore.activeTextTag){
            renderOneTextTag(ctx, envStore.activeTextTag, true)
        }
        renderCursor(ctx)
        renderDiscardArea(ctx)
        renderSelection(ctx)
        return lineExtendWays
    }
    
    const _45SubEps = Math.PI/4 - numberCmpEpsilon
    const _90AndEps = Math.PI/2 + numberCmpEpsilon
    /** 正在把“延长按钮拖出来的点”拖动时，其方向会智能自动调整 */
    function autoDirForNewExtended(){
        if(!envStore.movingExtendedPointOriginated || !envStore.activePt){
             //如果不是正在移动“延长按钮拖出来的点”，不做处理
             return
        }
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
    return { renderActiveCvs, canvasIdPrefix, noNeedActiveCvs }
})