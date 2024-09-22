import { useEnvStore } from "@/models/stores/envStore";
import { useCvs } from "../common/cvs";
import { useLineCvsWorker } from "../workers/lineCvsWorker";
import { usePointCvsWorker } from "../workers/pointCvsWorker";
import { useTextCvsWorker } from "../workers/textCvsWorker";

export function useMainCvsDispatcher(){
    const envStore = useEnvStore()
    envStore.pointMutated = renderMainCvs
    envStore.rescaled.push(renderMainPts)
    const { cvs: mainLineCvs, getCtx: getLineCtx } = useCvs()
    const { cvs: mainPtCvs, getCtx: getPtCtx } = useCvs()
    const { cvs: mainPtNameCvs, getCtx: getPtNameCtx } = useCvs()
    const { renderAllLines } = useLineCvsWorker()
    const { renderAllPoints } = usePointCvsWorker()
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
    }
    function renderMainPtNames(movedStaNames?:number[]){
        const ctx = getPtNameCtx();
        renderAllPtName(ctx, movedStaNames)
    }
    return { mainLineCvs, mainPtCvs, mainPtNameCvs, renderMainCvs }
}