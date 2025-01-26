import { useEnvStore } from "@/models/stores/envStore";
import { useCvs, useCvsBlocksControlStore } from "../common/cvs";
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
import { useScalerLocalConfigStore } from "@/app/localConfig/scalerLocalConfig";
import { useTimeSpanClock } from "@/utils/timeUtils/timeSpanClock";
import { CvsContext } from "../common/cvsContext";
import { AdsRenderType, useAdsCvsWorker } from "../workers/adsCvsWorker";

export interface MainCvsRenderingOptions{
    /** 这次渲染前哪些线路形状变动了？不提供即为所有 */
    changedLines?:number[],
    /** 这次渲染前哪些站名位置移动了？不提供即为所有 */
    movedStaNames?:number[],
    /** 阻止“渲染后”钩子触发 */
    suppressRenderedCallback?:boolean
    /** 导出式渲染 */
    forExport?:boolean
    /** 指定画布上下文 */
    ctx?: CvsContext
    /** 广告水印 (no/less/more) */
    withAds?: AdsRenderType
}

export const useMainCvsDispatcher = defineStore('mainCvsDispatcher', ()=>{
    const envStore = useEnvStore()
    const cs = useConfigStore()
    const scalerLocalConfig = useScalerLocalConfigStore()
    const canvasIdPrefix = 'main'
    const { getCtx: getCtx } = useCvs(canvasIdPrefix)
    const cvsBlocksControlStore = useCvsBlocksControlStore()
    const { renderAllLines } = useLineCvsWorker()
    const { renderAllPoints } = usePointCvsWorker()
    const { renderClusters } = useClusterCvsWorker()
    const { renderAllPtName } = useStaNameCvsWorker()
    const { renderAllTerrainSmooth } = useTerrainSmoothCvsWorker()
    const { renderAllTextTags } = useTextTagCvsWorker()
    const { renderAds } = useAdsCvsWorker()
    const afterMainCvsRendered = shallowRef<()=>void>()
    const isRendering = ref(false)
    const logRendering = import.meta.env.VITE_LogMainCvsRendering === 'true'
    const { tic, toc } = useTimeSpanClock(logRendering)
    function renderMainCvs(options:MainCvsRenderingOptions){
        const tStart = logRendering ? timestampMS():0
        isRendering.value = true
        const ctx = options.ctx || getCtx();
        const { changedLines, movedStaNames, suppressRenderedCallback, forExport } = options
        if(forExport){
            ctx.fillStyle = cs.config.bgColor
            ctx.fillTotal()
        }
        tic()
        renderAllLines(ctx, changedLines, LineType.terrain, 'carpet')
        tic('地形-地毯')
        renderAllTerrainSmooth(ctx)
        tic('地形-平滑')
        renderAllLines(ctx, [], LineType.terrain, 'body')
        tic('地形-本体')
        renderAllLines(ctx, changedLines, LineType.common)
        tic('线路')
        renderAllPoints(ctx, forExport, forExport)
        tic('点')
        renderClusters(ctx)
        tic('集群')
        renderAllPtName(ctx, movedStaNames, forExport)
        tic('站名')
        renderAllTextTags(ctx)
        toc('标签')
        if(options.withAds){
            renderAds(ctx, options.withAds)
        }
        isRendering.value = false
        if(logRendering){
            const tEnd = logRendering ? timestampMS():0
            console.log(`[${tEnd - tStart}ms] <主画布渲染>----------`)
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
    envStore.rescaled.push(()=>{
        if(scalerLocalConfig.steppedScaleEnabled){
            renderMainCvs({
                changedLines:[],
                movedStaNames:[],
                suppressRenderedCallback:true
            })
        }
    })
    cvsBlocksControlStore.blocksReformHandler.push(()=>{
        renderMainCvs({
            changedLines:undefined,
            movedStaNames:undefined,
            suppressRenderedCallback:true
        })
    })
    return { renderMainCvs, afterMainCvsRendered, canvasIdPrefix }
})