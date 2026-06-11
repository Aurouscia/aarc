import { useEnvStore } from "@/models/stores/envStore";
import { useCvs, useCvsBlocksControlStore } from "../common/cvs";
import { useGridCvsWorker } from "../workers/gridCvsWorker";
import { defineStore, storeToRefs } from "pinia";
import { useSnapStore } from "@/models/stores/snapStore";
import { useEditorLocalConfigStore } from "@/app/localConfig/editorLocalConfig";
import { watch } from "vue";

export const useBaseCvsDispatcher = defineStore('baseCvsDispatcher', ()=>{
    const canvasIdPrefix = 'base'
    const { getCtx } = useCvs(canvasIdPrefix)
    const { rescaled } = useEnvStore()
    const cvsBlocksControlStore = useCvsBlocksControlStore()
    rescaled.push(renderBaseCvs)
    cvsBlocksControlStore.blocksReformHandler.push(renderBaseCvs)
    const { renderGrid } = useGridCvsWorker()
    const { snapGridEnabled } = storeToRefs(useSnapStore())
    const { gridLabelSize } = storeToRefs(useEditorLocalConfigStore())
    function renderBaseCvs(){
        if(!snapGridEnabled.value)
            return
        const ctx = getCtx()
        renderGrid(ctx)
    }
    watch(snapGridEnabled, ()=>{
        if(snapGridEnabled.value)
            renderBaseCvs()
        else
            getCtx()//默认就会清屏
    })
    watch(gridLabelSize, ()=>{
        if(snapGridEnabled.value)
            renderBaseCvs()
    })
    return { renderBaseCvs, canvasIdPrefix }
})