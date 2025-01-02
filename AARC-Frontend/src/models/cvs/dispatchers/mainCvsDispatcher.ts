import { useEnvStore } from "@/models/stores/envStore";
import { useCvs } from "../common/cvs";
import { useLineCvsWorker } from "../workers/lineCvsWorker";
import { usePointCvsWorker } from "../workers/pointCvsWorker";
import { useStaNameCvsWorker } from "../workers/staNameCvsWorker";
import { useClusterCvsWorker } from "../workers/clusterCvsWorker";
import { defineStore } from "pinia";
import { useTerrainSmoothCvsWorker } from "../workers/terrainSmoothCvsWorker";
import { LineType } from "@/models/save";
import { useTextTagCvsWorker } from "../workers/textTagCvsWorker";
import { ref, shallowRef } from "vue";
import { useConfigStore } from "@/models/stores/configStore";
import { timestampMS } from "@/utils/timeUtils/timestamp";

export interface MainCvsRenderingOptions{
    /** 这次渲染前哪些线路形状变动了？不提供即为所有 */
    changedLines?:number[],
    /** 这次渲染前哪些站名位置移动了？不提供即为所有 */
    movedStaNames?:number[],
    /** 阻止“渲染后”钩子触发 */
    suppressRenderedCallback?:boolean
    /** 导出式渲染 */
    forExport?:boolean
}

export const useMainCvsDispatcher = defineStore('mainCvsDispatcher', ()=>{
    const envStore = useEnvStore()
    const cs = useConfigStore()
    const { cvs: mainCvs, getCtx: getCtx } = useCvs()
    const { renderAllLines } = useLineCvsWorker()
    const { renderAllPoints } = usePointCvsWorker()
    const { renderClusters } = useClusterCvsWorker()
    const { renderAllPtName } = useStaNameCvsWorker()
    const { renderAllTerrainSmooth } = useTerrainSmoothCvsWorker()
    const { renderAllTextTags } = useTextTagCvsWorker()
    const afterMainCvsRendered = shallowRef<()=>void>()
    const isRendering = ref(false)
    const logRendering = import.meta.env.VITE_LogMainCvsRendering === 'true'
    function renderMainCvs(options:MainCvsRenderingOptions){
        const tStart = logRendering ? timestampMS():0
        isRendering.value = true
        const ctx = getCtx();
        const { changedLines, movedStaNames, suppressRenderedCallback, forExport } = options
        if(forExport){
            ctx.fillStyle = cs.config.bgColor
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        }
        renderAllLines(ctx, changedLines, LineType.terrain, 'carpet')
        renderAllTerrainSmooth(ctx)
        renderAllLines(ctx, [], LineType.terrain, 'body')
        renderAllLines(ctx, changedLines, LineType.common)
        renderAllPoints(ctx, forExport)
        renderClusters(ctx)
        renderAllPtName(ctx, movedStaNames)
        renderAllTextTags(ctx)
        isRendering.value = false
        if(logRendering){
            const tEnd = logRendering ? timestampMS():0
            console.log(`主画布渲染 [${tEnd - tStart}ms]`)
        }
        if(!suppressRenderedCallback && afterMainCvsRendered.value)
            afterMainCvsRendered.value()
    }
    envStore.rerender = (changedLines, movedStaNames)=>{
        renderMainCvs({
            changedLines,
            movedStaNames
        })
    }
    // envStore.rescaled.push(()=>renderMainCvs({
    //     changedLines:[],
    //     movedStaNames:[],
    //     suppressRenderedCallback:true
    // }))
    return { mainCvs, renderMainCvs, afterMainCvsRendered }
})