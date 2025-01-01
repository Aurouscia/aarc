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
import { shallowRef } from "vue";
import { useConfigStore } from "@/models/stores/configStore";

export const useMainCvsDispatcher = defineStore('mainCvsDispatcher', ()=>{
    const envStore = useEnvStore()
    const cs = useConfigStore()
    envStore.pointMutated = renderMainCvs
    const { cvs: mainCvs, getCtx: getCtx } = useCvs()
    const { renderAllLines } = useLineCvsWorker()
    const { renderAllPoints } = usePointCvsWorker()
    const { renderClusters } = useClusterCvsWorker()
    const { renderAllPtName } = useStaNameCvsWorker()
    const { renderAllTerrainSmooth } = useTerrainSmoothCvsWorker()
    const { renderAllTextTags } = useTextTagCvsWorker()
    const afterMainCvsRendered = shallowRef<()=>void>()
    function renderMainCvs(
            changedLines?:number[],
            movedStaNames?:number[],
            suppressRenderedCallback:boolean = false,
            fillCvsBgColor?:boolean){
        console.log('绘制主画布')
        const ctx = getCtx();
        if(fillCvsBgColor){
            ctx.fillStyle = cs.config.bgColor
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        }
        renderAllLines(ctx, changedLines, LineType.terrain, 'carpet')
        renderAllTerrainSmooth(ctx)
        renderAllLines(ctx, [], LineType.terrain, 'body')
        renderAllLines(ctx, changedLines, LineType.common)
        renderAllPoints(ctx)
        renderClusters(ctx)
        renderAllPtName(ctx, movedStaNames)
        renderAllTextTags(ctx)
        if(!suppressRenderedCallback && afterMainCvsRendered.value)
            afterMainCvsRendered.value()
    }
    return { mainCvs, renderMainCvs, afterMainCvsRendered }
})