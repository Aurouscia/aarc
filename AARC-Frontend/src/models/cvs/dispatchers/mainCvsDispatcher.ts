import { useEnvStore } from "@/models/stores/envStore";
import { useCvs } from "../common/cvs";
import { useLineCvsWorker } from "../workers/lineCvsWorker";
import { usePointCvsWorker } from "../workers/pointCvsWorker";
import { useTextCvsWorker } from "../workers/textCvsWorker";
import { useClusterCvsWorker } from "../workers/clusterCvsWorker";

export function useMainCvsDispatcher(){
    const envStore = useEnvStore()
    envStore.pointMutated = renderMainCvs
    const { cvs: mainLineCvs, getCtx: getLineCtx } = useCvs()
    const { cvs: mainPtCvs, getCtx: getPtCtx } = useCvs()
    const { cvs: mainPtNameCvs, getCtx: getPtNameCtx } = useCvs()
    const { renderAllLines } = useLineCvsWorker()
    const { renderAllPoints } = usePointCvsWorker()
    const { renderClusters } = useClusterCvsWorker()
    const { renderAllPtName } = useTextCvsWorker()
    function renderMainCvs(changedLines?:number[], movedStaNames?:number[]){
        const ctx = getLineCtx();
        renderAllLines(ctx, changedLines)
        renderMainPts()
        renderMainPtNames(movedStaNames)
    }
    function renderMainPts(){
        const ctx = getPtCtx();
        renderAllPoints(ctx)
        renderClusters(ctx)
    }
    function renderMainPtNames(movedStaNames?:number[]){
        const ctx = getPtNameCtx();
        renderAllPtName(ctx, movedStaNames)
    }
    return { mainLineCvs, mainPtCvs, mainPtNameCvs, renderMainCvs }
}