import { useCvs } from "../common/cvs";
import { useGridCvsWorker } from "../workers/gridCvsWorker";

export function useBaseCvsDispatcher(){
    const { cvs: baseCvs, getCtx } = useCvs()
    const { renderGrid } = useGridCvsWorker()
    function renderBaseCvs(){
        const ctx = getCtx()
        renderGrid(ctx)
    }
    return { baseCvs, renderBaseCvs }
}