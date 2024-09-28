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
        const activeLineId = envStore.activeLineId
        if(activeLineId >= 0){
            const line = saveStore.save?.lines.find(x=>x.id == activeLineId)
            if(line){
                renderLine(ctx, line)
                renderLinePoints(ctx, line)
            }
        }
        const activePtId = envStore.activePtId;
        if(activePtId >= 0){
            if(envStore.activePtType=='body'){
                const activeSegs = saveStore.adjacentSegs(activePtId)
                if(activeSegs.length>0){
                    renderSegsLine(ctx, activeSegs)
                    renderSegsPoints(ctx, activeSegs, activePtId)
                }else{
                    renderPointById(ctx, activePtId, true)
                }
                renderPtNameById(ctx, activePtId)
            }else if(envStore.activePtType=='name'){
                renderPointById(ctx, activePtId, false)
                renderPtNameById(ctx, activePtId, true, true)
            }
        }
        if(envStore.movingPoint && envStore.activePtType=='body' && snapStore.snapLines){
            const ls = snapStore.snapLines
            ls.forEach(l=>{
                renderRay(ctx, l.source, l.way)
            })
        }
    }
    return { activeCvs, renderActiveCvs }
}