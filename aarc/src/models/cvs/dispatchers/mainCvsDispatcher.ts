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
import { useTimeSpanClock } from "@/utils/timeUtils/timeSpanClock";
import { CvsContext, CvsBlock } from "../common/cvsContext";
import { useAdsCvsWorker } from "../workers/adsCvsWorker";
import { AdsRenderType, ExportGridLayer, ExportGridLevel } from "@/app/localConfig/exportLocalConfig";
import { usePointLinkStore } from "@/models/stores/pointLinkStore";
import { usePointLinkCvsWorker } from "../workers/pointLinkCvsWorker";
import { useWatermarkCvsWorker } from "../workers/watermarkCvsWorker";
import { useRenderOptionsStore } from "@/models/stores/renderOptionsStore";
import { useBgRefImageCvsWorker } from "../workers/bgRefImageCvsWorker";
import { useGridCvsWorker } from "../workers/gridCvsWorker";
import { Context as SvgCanvasContext } from 'svgcanvas';
import { optimizeSvg } from "@/utils/svgUtils/optimizeSvg";
import { useSaveStore } from "@/models/stores/saveStore";


export interface MainCvsRenderingOptions{
    /** 这次渲染前哪些站名位置移动了？不提供即为所有 */
    movedStaNames?: number[],
    /** 阻止“渲染后”钩子触发 */
    suppressRenderedCallback?: boolean
    /** 指定画布上下文 */
    ctx?: CvsContext
    /** 广告水印 (no/less/more) */
    withAds?: AdsRenderType
    /** 背景参考图 */
    withBgRefImage?: boolean
    /** 导出网格线 (none/under/over) */
    withGridLayer?: ExportGridLayer
    /** 导出网格等级 (1-5) */
    withGridLevel?: ExportGridLevel
}

export const useMainCvsDispatcher = defineStore('mainCvsDispatcher', ()=>{
    const envStore = useEnvStore()
    const cs = useConfigStore()
    const renderOptionsStore = useRenderOptionsStore()
    const canvasIdPrefix = 'main'
    const { getCtx: getCtx } = useCvs(canvasIdPrefix)
    const cvsBlocksControlStore = useCvsBlocksControlStore()
    const pointLinkStore = usePointLinkStore()

    const { renderAllLines } = useLineCvsWorker()
    const { renderAllPoints } = usePointCvsWorker()
    const { renderClusters, getClustersRenderingData } = useClusterCvsWorker()
    const { renderAllPtName } = useStaNameCvsWorker()
    const { renderAllTerrainSmooth } = useTerrainSmoothCvsWorker()
    const { renderAllTextTags } = useTextTagCvsWorker()
    const { renderAllLinks } = usePointLinkCvsWorker()
    const { renderAds } = useAdsCvsWorker()
    const { renderWatermark } = useWatermarkCvsWorker()
    const { renderBgRefImage } = useBgRefImageCvsWorker()
    const { renderGrid } = useGridCvsWorker()
    const saveStore = useSaveStore()
    const afterMainCvsRendered = shallowRef<()=>void>()
    const isRendering = ref(false)
    const logRendering = import.meta.env.VITE_LogMainCvsRendering === 'true'
    const { tic, toc } = useTimeSpanClock(logRendering)
    const visitorMode = ref(false)
    function renderMainCvs(options:MainCvsRenderingOptions){
        const tStart = logRendering ? timestampMS():0
        isRendering.value = true
        const ctx = options.ctx || getCtx();
        const { movedStaNames, suppressRenderedCallback } = options
        const forExport = renderOptionsStore.exporting
        if(forExport){
            ctx.globalAlpha = renderOptionsStore.bgOpacity ?? 1
            ctx.fillStyle = cs.config.bgColor
            ctx.fillTotal()
            ctx.globalAlpha = 1
            if(options.withBgRefImage){
                renderBgRefImage(ctx)
            }
            if(options.withGridLayer === 'under'){
                renderGridForExport(ctx, options.withGridLevel)
            }
        }
        if(!visitorMode.value)
            renderWatermark(ctx, 'beforeMain', forExport)

        const creatingLinkOrSlice = pointLinkStore.isCreating
        tic()
        renderAllLines(ctx, LineType.terrain, 'carpet')
        tic('地形-地毯')
        renderAllTerrainSmooth(ctx, 'carpet')
        tic('地形-平滑地毯')
        renderAllTerrainSmooth(ctx, 'body')
        tic('地形-平滑')
        renderAllLines(ctx, LineType.terrain, 'body')
        tic('地形-本体')
        renderAllTextTags(ctx, 'sunken')
        renderAllLines(ctx, LineType.common)
        tic('线路')
        renderAllPoints(ctx, forExport, forExport)
        tic('点')
        const clusterData = getClustersRenderingData()
        renderClusters(ctx, clusterData, 'carpet', creatingLinkOrSlice)
        renderAllLinks(ctx, 'carpet')
        renderClusters(ctx, clusterData, 'body', creatingLinkOrSlice)
        renderAllLinks(ctx, 'body')
        renderClusters(ctx, clusterData, 'core', creatingLinkOrSlice, !forExport)
        renderAllLinks(ctx, 'core')
        tic('集群')
        renderAllPtName(ctx, movedStaNames, forExport)
        tic('站名')
        renderAllTextTags(ctx, 'notSunken')
        toc('标签')
        
        if(options.withAds){
            renderAds(ctx, options.withAds)
        }
        if(forExport && options.withGridLayer === 'over'){
            renderGridForExport(ctx, options.withGridLevel)
        }
        if(!visitorMode.value)
            renderWatermark(ctx, 'afterMain', forExport)
        isRendering.value = false
        if(logRendering){
            const tEnd = logRendering ? timestampMS():0
            console.log(`[${tEnd - tStart}ms] <主画布渲染>----------`)
        }
        if(!suppressRenderedCallback && afterMainCvsRendered.value)
            afterMainCvsRendered.value()
    }
    async function renderMainCvsToSvgBlob(options?: Pick<MainCvsRenderingOptions, 'withAds' | 'withBgRefImage' | 'withGridLayer' | 'withGridLevel'>):Promise<Blob>{
        const cvsWidth = saveStore.cvsWidth
        const cvsHeight = saveStore.cvsHeight
        const svgCtx = new SvgCanvasContext({ width: cvsWidth, height: cvsHeight })
        const ctx = new CvsContext(new CvsBlock(1, 0, 0, svgCtx))
        const originalExporting = renderOptionsStore.exporting
        renderOptionsStore.exporting = true
        try{
            renderMainCvs({
                movedStaNames: [],
                suppressRenderedCallback: true,
                ctx,
                withAds: options?.withAds ?? 'no',
                withBgRefImage: options?.withBgRefImage ?? false,
                withGridLayer: options?.withGridLayer ?? 'none',
                withGridLevel: options?.withGridLevel
            })
            const svgStr = svgCtx.getSerializedSvg(true)
            let optimizedSvgStr = svgStr
            try{
                optimizedSvgStr = await optimizeSvg(svgStr)
            }catch(e){
                console.error('SVGO 优化失败，使用原始 SVG', e)
            }
            return new Blob([optimizedSvgStr], { type: 'image/svg+xml;charset=utf-8' })
        }finally{
            renderOptionsStore.exporting = originalExporting
        }
    }
    envStore.rerender = (_changedLines, movedStaNames)=>{
        // TODO：将rerender的参数改为对象
        renderMainCvs({
            movedStaNames
        })
    }
    cvsBlocksControlStore.blocksReformHandler.push(()=>{
        renderMainCvs({
            movedStaNames:undefined,
            suppressRenderedCallback:true
        })
    })
    function renderGridForExport(ctx: CvsContext, level?: ExportGridLevel){
        if(!level)
            return
        renderGrid(ctx, {
            viewRectInRatio: { left:0, right:1, top:0, bottom:1 },
            level: level,
            updateSnapGridIntv: false
        })
    }
    return { renderMainCvs, renderMainCvsToSvgBlob, afterMainCvsRendered, canvasIdPrefix, visitorMode }
})