import { useCvs } from "../common/cvs";
import { useLineCvsWorker } from "../workers/lineCvsWorker";
import { usePointCvsWorker } from "../workers/pointCvsWorker";

export function useMainCvsDispatcher(){
    const { cvs: mainCvs, getCtx } = useCvs()
    const { renderAllLines } = useLineCvsWorker()
    const { renderAllPoints } = usePointCvsWorker()
    function renderMainCvs(){
        const ctx = getCtx();
        renderAllLines(ctx)
        renderAllPoints(ctx)
    }
    return { mainCvs, renderMainCvs }
}