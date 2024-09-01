import { useEnvStore } from "@/models/stores/envStore";
import { useCvs } from "../common/cvs";
import { useLineCvsWorker } from "../workers/lineCvsWorker";
import { usePointCvsWorker } from "../workers/pointCvsWorker";

export function useMainCvsDispatcher(){
    const envStore = useEnvStore()
    envStore.pointMoved = renderMainCvs
    envStore.rescaled.push(renderMainPts)
    const { cvs: mainLineCvs, getCtx: getLineCtx } = useCvs()
    const { cvs: mainPtCvs, getCtx: getPtCtx } = useCvs()
    const { renderAllLines } = useLineCvsWorker()
    const { renderAllPoints } = usePointCvsWorker()
    function renderMainCvs(changedLines?:number[]){
        const ctx = getLineCtx();
        renderAllLines(ctx, changedLines)
        renderMainPts()
    }
    function renderMainPts(){
        const ctx = getPtCtx();
        renderAllPoints(ctx)
    }
    return { mainLineCvs, mainPtCvs, renderMainCvs }
}