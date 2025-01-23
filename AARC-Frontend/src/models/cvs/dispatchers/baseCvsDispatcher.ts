import { useEnvStore } from "@/models/stores/envStore";
import { useCvs, useCvsBlocksControlStore } from "../common/cvs";
import { useGridCvsWorker } from "../workers/gridCvsWorker";
import { defineStore } from "pinia";

export const useBaseCvsDispatcher = defineStore('baseCvsDispatcher', ()=>{
    const canvasIdPrefix = 'base'
    const { getCtx } = useCvs(canvasIdPrefix)
    const { rescaled } = useEnvStore()
    const cvsBlocksControlStore = useCvsBlocksControlStore()
    rescaled.push(renderBaseCvs)
    cvsBlocksControlStore.blocksReformHandler.push(renderBaseCvs)
    const { renderGrid } = useGridCvsWorker()
    function renderBaseCvs(){
        const ctx = getCtx()
        renderGrid(ctx)
    }
    return { renderBaseCvs, canvasIdPrefix }
})