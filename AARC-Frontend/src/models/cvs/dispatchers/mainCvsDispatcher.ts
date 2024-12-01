import { useEnvStore } from "@/models/stores/envStore";
import { useCvs } from "../common/cvs";
import { useLineCvsWorker } from "../workers/lineCvsWorker";
import { usePointCvsWorker } from "../workers/pointCvsWorker";
import { useTextCvsWorker } from "../workers/textCvsWorker";
import { useClusterCvsWorker } from "../workers/clusterCvsWorker";
import { defineStore } from "pinia";
import { useTerrainSmoothCvsWorker } from "../workers/TerrainSmoothCvsWorker";
import { LineType } from "@/models/save";

export const useMainCvsDispatcher = defineStore('mainCvsDispatcher', ()=>{
    const envStore = useEnvStore()
    envStore.pointMutated = renderMainCvs
    const { cvs: mainCvs, getCtx: getCtx } = useCvs()
    const { renderAllLines } = useLineCvsWorker()
    const { renderAllPoints } = usePointCvsWorker()
    const { renderClusters } = useClusterCvsWorker()
    const { renderAllPtName } = useTextCvsWorker()
    const { renderAllTerrainSmooth } = useTerrainSmoothCvsWorker()
    function renderMainCvs(changedLines?:number[], movedStaNames?:number[]){
        console.log('绘制主画布')
        const ctx = getCtx();
        renderAllLines(ctx, changedLines, LineType.terrain, 'carpet')
        renderAllTerrainSmooth(ctx)
        renderAllLines(ctx, [], LineType.terrain, 'body')
        renderAllLines(ctx, changedLines, LineType.common)
        renderAllPoints(ctx)
        renderClusters(ctx)
        renderAllPtName(ctx, movedStaNames)
    }
    return { mainCvs, renderMainCvs }
})