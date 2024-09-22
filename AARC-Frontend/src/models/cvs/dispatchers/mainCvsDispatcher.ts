import { useEnvStore } from "@/models/stores/envStore";
import { useCvs } from "../common/cvs";
import { useLineCvsWorker } from "../workers/lineCvsWorker";
import { usePointCvsWorker } from "../workers/pointCvsWorker";
import { useTextCvsWorker } from "../workers/textCvsWorker";

export function useMainCvsDispatcher(){
    const envStore = useEnvStore()
    envStore.pointMoved = renderMainCvs
    envStore.rescaled.push(renderMainPts)
    const { cvs: mainLineCvs, getCtx: getLineCtx } = useCvs()
    const { cvs: mainPtCvs, getCtx: getPtCtx } = useCvs()
    const { cvs: mainPtNameCvs, getCtx: getPtNameCtx } = useCvs()
    const { renderAllLines } = useLineCvsWorker()
    const { renderAllPoints } = usePointCvsWorker()
    const { renderAllPtName } = useTextCvsWorker()
    function renderMainCvs(changedLines?:number[]){
        const ctx = getLineCtx();
        renderAllLines(ctx, changedLines)
        renderMainPts()
        renderMainPtNames()
    }
    function renderMainPts(){
        const ctx = getPtCtx();
        renderAllPoints(ctx)
    }
    function renderMainPtNames(){
        const ctx = getPtNameCtx();
        renderAllPtName(ctx)
    }
    return { mainLineCvs, mainPtCvs, mainPtNameCvs, renderMainCvs }
}