import { useEnvStore } from "@/models/stores/envStore";
import { useCvs } from "../common/cvs";
import { useLineCvsWorker } from "../workers/lineCvsWorker";
import { usePointCvsWorker } from "../workers/pointCvsWorker";
import { useTextCvsWorker } from "../workers/textCvsWorker";
import { useClusterCvsWorker } from "../workers/clusterCvsWorker";

export function useMainCvsDispatcher(){
    const envStore = useEnvStore()
    envStore.pointMutated = renderMainCvs
    const { cvs: mainCvs, getCtx: getCtx } = useCvs()
    const { renderAllLines } = useLineCvsWorker()
    const { renderAllPoints } = usePointCvsWorker()
    const { renderClusters } = useClusterCvsWorker()
    const { renderAllPtName } = useTextCvsWorker()
    function renderMainCvs(changedLines?:number[], movedStaNames?:number[]){
        const ctx = getCtx();
        renderAllLines(ctx, changedLines)
        renderAllPoints(ctx)
        renderClusters(ctx)
        renderAllPtName(ctx, movedStaNames)
    }
    return { mainCvs, renderMainCvs }
}