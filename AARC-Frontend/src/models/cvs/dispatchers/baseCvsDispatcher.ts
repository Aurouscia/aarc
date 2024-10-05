import { useEnvStore } from "@/models/stores/envStore";
import { useCvs } from "../common/cvs";
import { useGridCvsWorker } from "../workers/gridCvsWorker";

export function useBaseCvsDispatcher(){
    const { cvs: baseCvs, getCtx } = useCvs()
    const { rescaled } = useEnvStore()
    rescaled.push(renderBaseCvs)
    const { renderGrid } = useGridCvsWorker()
    function renderBaseCvs(){
        const ctx = getCtx()
        renderGrid(ctx)
    }
    return { baseCvs, renderBaseCvs }
}