import { ControlPoint } from "@/models/save";
import { defineStore } from "pinia";
import { useSaveStore } from "../saveStore";
import { useConfigStore } from "../configStore";

import { ref } from "vue";
import { numberCmpEpsilon } from "@/utils/consts";
import { Coord } from '@/models/coord';
import {
    buildNeighbors,
    cleanNeighborsForDeletedPt,
    getMaxSizePtWithinClusterPure,
    getRectOfClusterPure,
    getStaClusterByIdPure,
    isPtSinglePure,
    makeClustersFromNeighborsPure,
    Neighbors,
    resolveStaNamePure,
    tryTransferStaNameWithinClusterPure,
    updateNeighborsForMovedPt
} from "./staClusterStore.pure";

export const useStaClusterStore = defineStore('staCluster', ()=>{
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    saveStore.deletedPoint = cleanClustersFromDeletedPt
    
    const configClingingDist = cs.config.snapOctaClingPtPtDist

    const staClusters = ref<ControlPoint[][]>()
    const maxSizeCache = new Map<string, number>()
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
            numberCmpEpsilon
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
            numberCmpEpsilon
        )
        makeClustersFromNeighbors()
        maxSizeCache.clear()
    }
    function cleanClustersFromDeletedPt(ptId:number){
        neighbors = cleanNeighborsForDeletedPt(neighbors, ptId)
        makeClustersFromNeighbors()
        maxSizeCache.clear()
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
        const key = `${ptId}|${sizeType}`
        const cached = maxSizeCache.get(key)
        if(cached !== undefined)
            return cached
        const get = sizeType === 'ptSize' 
            ? (id:number)=>saveStore.getLinesDecidedPtSize(id)
            : sizeType === 'ptNameSize'
            ? (id:number)=>saveStore.getLinesDecidedPtNameSize(id)
            : (id:number)=>saveStore.getLinesDecidedPtNameSnapSize(id)
        const res = getMaxSizePtWithinClusterPure(ptId, getStaClusters() || [], get)
        maxSizeCache.set(key, res)
        return res
    }
    function getRectOfCluster(cluster: ControlPoint[]|undefined):Coord[] {
        if (!cluster || cluster.length === 0)
            return []
        return getRectOfClusterPure(cluster)
    }
    function clearItems(){
        staClusters.value = undefined
        neighbors = {}
        maxSizeCache.clear()
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
