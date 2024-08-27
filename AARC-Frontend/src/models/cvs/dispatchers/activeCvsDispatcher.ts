import { useSaveStore } from "@/models/stores/saveStore";
import { useCvs } from "../common/cvs";
import { useLineCvsWorker } from "../workers/lineCvsWorker";
import { useEnvStore } from "@/models/stores/envStore";
import { usePointCvsWorker } from "../workers/pointCvsWorker";

export function useActiveCvsDispatcher(){
    const saveStore = useSaveStore()
    const envStore = useEnvStore()
    const { cvs: activeCvs, getCtx } = useCvs()
    const { renderSegsLine } = useLineCvsWorker()
    const { renderSegsPoints } = usePointCvsWorker()
    function renderActiveCvs(){
        const ctx = getCtx();
        const activeId = envStore.activePtId;
        if(activeId === undefined)
            return;
        const activeSegs = saveStore.adjacentSegs(activeId)
        renderSegsLine(ctx, activeSegs)
        renderSegsPoints(ctx, activeSegs, activeId)
    }
    return { activeCvs, renderActiveCvs }
}