import { useSaveStore } from "@/models/stores/saveStore";
import { useCvs } from "../common/cvs";
import { useLineCvsWorker } from "../workers/lineCvsWorker";
import { useEnvStore } from "@/models/stores/envStore";
import { usePointCvsWorker } from "../workers/pointCvsWorker";
import { useRayCvsWorker } from "../workers/rayCvsWorker";
import { useSnapStore } from "@/models/stores/snapStore";
import { useTextCvsWorker } from "../workers/textCvsWorker";

export function useActiveCvsDispatcher(){
    const saveStore = useSaveStore()
    const envStore = useEnvStore()
    const snapStore = useSnapStore()
    const { cvs: activeCvs, getCtx } = useCvs()
    const { renderSegsLine, renderLine } = useLineCvsWorker()
    const { renderSegsPoints, renderLinePoints, renderPointById } = usePointCvsWorker()
    const { renderRay } = useRayCvsWorker()
    const { renderPtNameById } = useTextCvsWorker()
    envStore.rescaled.push(renderActiveCvs)
    function renderActiveCvs(){
        const ctx = getCtx();
        if(envStore.activeLine){
            renderLine(ctx, envStore.activeLine)
            renderLinePoints(ctx, envStore.activeLine)
        }
        const activePtId = envStore.activePt?.id;
        if(activePtId){
            const activeSegs = saveStore.adjacentSegs(activePtId)
            if(activeSegs.length>0){
                renderSegsLine(ctx, activeSegs)
                renderSegsPoints(ctx, activeSegs, activePtId)
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
    }
    return { activeCvs, renderActiveCvs }
}