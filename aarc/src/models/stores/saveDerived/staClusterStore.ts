import { ControlPoint } from "@/models/save";
import { defineStore } from "pinia";
import { useSaveStore } from "../saveStore";
import { useConfigStore } from "../configStore";
import { useFreePtDirectionStore } from "./freePtDirectionStore";
import { computeFreeSnapCandidates } from "@/utils/snapUtils/snapInterPtFree";
import { numberCmpEpsilon } from "@/utils/consts";
import { computed, ref } from "vue";
import { Coord } from '@/models/coord';
import {
    buildNeighbors,
    cleanNeighborsForDeletedPt,
    getCandidatesBbox,
    getClusterMaxSizePure,
    getRectOfClusterPure,
    getStaClusterByIdPure,
    isPtSinglePure,
    makeClustersFromNeighborsPure,
    Neighbors,
    PtSnapCandidatesInfo,
    resolveStaNamePure,
    tryTransferStaNameWithinClusterPure,
    updateNeighborsForMovedPt
} from "./staClusterStore.pure";

export const useStaClusterStore = defineStore('staCluster', ()=>{
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    const freePtDirectionStore = useFreePtDirectionStore()
    saveStore.deletedPoint = cleanClustersFromDeletedPt
    
    const configClingingDist = cs.config.snapOctaClingPtPtDist

    /**
     * 获取点的吸附候选位置及其在 x/y 轴上的最大偏移（reach）。
     * 对 free 点使用两侧线段方向生成候选（含平行线交点）；
     * 非 free 点退化为 [pt.pos]，reach 为 0。
     */
    function getPtSnapCandidatesAndReach(pt: ControlPoint): PtSnapCandidatesInfo {
        const size = saveStore.getLinesDecidedPtSnapSize(pt.id)
        const snapDist = size * configClingingDist
        const directionInfo = freePtDirectionStore.getPtDirectionInfo(pt.id)
        const candidates = computeFreeSnapCandidates(pt, snapDist, directionInfo)
        let reach = 0
        for (const c of candidates) {
            const dx = Math.abs(c[0] - pt.pos[0])
            const dy = Math.abs(c[1] - pt.pos[1])
            if (dx > reach) reach = dx
            if (dy > reach) reach = dy
        }
        return { candidates, reach, bbox: getCandidatesBbox(candidates) }
    }

    const staClusters = ref<ControlPoint[][]>()
    const staBelongToCluster = computed<Record<number, ControlPoint[]|undefined>>(()=>{
        const clusters = staClusters.value
        if(!clusters)
            return {}
        const res:Record<number, ControlPoint[]|undefined> = {}
        for(const c of clusters){
            for(const pt of c){
                res[pt.id] = c
            }
        }
        return res
    })
    function getStaClusters(){
        if(!staClusters.value){
            initNeighbors()
            makeClustersFromNeighbors()
        }
        return staClusters.value
    }

    /**
     * 记录每个点的邻点，在有点移动或删除时，需要更新
     */
    let neighbors:Neighbors = {}
    function initNeighbors() {
        const pts = saveStore.save?.points
        if (!pts)
            return
        neighbors = buildNeighbors(
            pts,
            configClingingDist,
            id => saveStore.getLinesDecidedPtSnapSize(id),
            numberCmpEpsilon,
            getPtSnapCandidatesAndReach
        )
    }
    function makeClustersFromNeighbors(){
        staClusters.value = makeClustersFromNeighborsPure(
            neighbors,
            id => saveStore.getPtById(id)
        )
    }

    function updateClustersBecauseOf(pt:ControlPoint){
        neighbors = updateNeighborsForMovedPt(
            neighbors,
            pt,
            saveStore.save?.points || [],
            configClingingDist,
            id => saveStore.getLinesDecidedPtSnapSize(id),
            numberCmpEpsilon,
            getPtSnapCandidatesAndReach
        )
        makeClustersFromNeighbors()
    }
    function cleanClustersFromDeletedPt(ptId:number){
        neighbors = cleanNeighborsForDeletedPt(neighbors, ptId)
        makeClustersFromNeighbors()
    }

    function tryTransferStaNameWithinCluster(sta:ControlPoint){
        const cluster = getStaClusters()?.find(c=>c.find(s=>s.id === sta.id))
        if(!cluster)
            return
        const transfer = tryTransferStaNameWithinClusterPure(sta, cluster)
        if(!transfer)
            return
        const target = saveStore.getPtById(transfer.toId)
        if(!target)
            return
        target.name = transfer.name
        target.nameS = transfer.nameS
        target.nameP = transfer.nameP
        return target
    }
    function getMaxSizePtWithinCluster(ptId:number, sizeType:'ptSize'|'ptNameSize'|'ptNameSnapSize'){
        const get = sizeType === 'ptSize' 
            ? (id:number)=>saveStore.getLinesDecidedPtSize(id)
            : sizeType === 'ptNameSize'
            ? (id:number)=>saveStore.getLinesDecidedPtNameSize(id)
            : (id:number)=>saveStore.getLinesDecidedPtNameSnapSize(id)
        return getClusterMaxSizePure(staBelongToCluster.value[ptId], get, ptId)
    }
    function getRectOfCluster(cluster: ControlPoint[]|undefined):Coord[] {
        if (!cluster || cluster.length === 0)
            return []
        return getRectOfClusterPure(cluster)
    }
    function clearItems(){
        staClusters.value = undefined
        neighbors = {}
    }
    function getStaClusterById(ptId:number){
        return getStaClusterByIdPure(ptId, getStaClusters() || [], id => saveStore.getPtById(id))
    }
    function getStaName(ptId: number, raw?: boolean): {name: string, nameSub: string, ptId: number} {
        return resolveStaNamePure(
            ptId,
            !!raw,
            saveStore.save?.points || [],
            saveStore.save?.pointLinks || [],
            getStaClusters() || []
        )
    }

    function isPtSingle(ptId: number) {
        const pt = saveStore.getPtById(ptId)
        if (!pt)
            return false
        return isPtSinglePure(ptId, getStaClusters() || [])
    }
    return {
        getStaClusters,
        updateClustersBecauseOf,
        tryTransferStaNameWithinCluster,
        getMaxSizePtWithinCluster,
        clearItems,
        getRectOfCluster,
        getStaClusterById,
        isPtSingle,
        getStaName,
        cleanClustersFromDeletedPt
    }
})
