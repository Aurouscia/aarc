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

export const useActiveCvsDispatcher = defineStore('activeCvsDispatcher', ()=>{
    const saveStore = useSaveStore()
    const envStore = useEnvStore()
    const snapStore = useSnapStore()
    const lineExtendStore = useLineExtendStore()
    const { cvs: activeCvs, getCtx } = useCvs()
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
        const activePtId = envStore.activePt?.id;
        if(activePtId){
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
    return { activeCvs, renderActiveCvs }
})