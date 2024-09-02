import { useSaveStore } from "@/models/stores/saveStore";
import { useCvs } from "../common/cvs";
import { useLineCvsWorker } from "../workers/lineCvsWorker";
import { useEnvStore } from "@/models/stores/envStore";
import { usePointCvsWorker } from "../workers/pointCvsWorker";

export function useActiveCvsDispatcher(){
    const saveStore = useSaveStore()
    const envStore = useEnvStore()
    const { cvs: activeCvs, getCtx } = useCvs()
    const { renderSegsLine, renderLine } = useLineCvsWorker()
    const { renderSegsPoints, renderLinePoints } = usePointCvsWorker()
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
            const activeSegs = saveStore.adjacentSegs(activePtId)
            renderSegsLine(ctx, activeSegs)
            renderSegsPoints(ctx, activeSegs, activePtId)
        }
    }
    return { activeCvs, renderActiveCvs }
}