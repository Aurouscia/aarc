import { ControlPoint, ControlPointSta } from "@/models/save";
import { coordDistSq, coordDistSqLessThan } from "@/utils/coordUtils/coordDist";
import { coordAdd, coordSub } from "@/utils/coordUtils/coordMath";
import { defineStore } from "pinia";
import { useSaveStore } from "../saveStore";
import { useConfigStore } from "../configStore";
import { numberCmpEpsilon } from "@/utils/consts";
import { computed, ref } from "vue";
import { Coord } from '@/models/coord';

export const useStaClusterStore = defineStore('staCluster', ()=>{
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    saveStore.deletedPoint = cleanClustersFromDeletedPt
    
    const configClingingDist = cs.config.snapOctaClingPtPtDist
    const skipClingingCheckThrs = 2.5*configClingingDist

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
    let neighbors:Record<string, Set<number>|undefined> = {}
    function initNeighbors(): ControlPoint[][] | undefined {
        const pts = saveStore.save?.points.filter(pt => pt.sta == ControlPointSta.sta)
        if (!pts)
            return;
        neighbors = {}
        for (let i = 0; i < pts.length - 1; i++) {
            for (let j = i + 1; j < pts.length; j++) {
                const a = pts[i]
                const b = pts[j]
                if(Math.abs(a.pos[0] - b.pos[0]) > skipClingingCheckThrs)
                    continue
                if(Math.abs(a.pos[1] - b.pos[1]) > skipClingingCheckThrs)
                    continue
                if(ptClinging(a, b)){
                    if(!neighbors[a.id])
                        neighbors[a.id] = new Set<number>()
                    if(!neighbors[b.id])
                        neighbors[b.id] = new Set<number>()
                    neighbors[a.id]?.add(b.id)
                    neighbors[b.id]?.add(a.id)
                }
            }
        }
    }
    function makeClustersFromNeighbors(){
        const usedPtIds = new Set<number>()
        staClusters.value = [] // 清空
        for(const pt of Object.entries(neighbors)){
            const ptId = Number(pt[0])
            if(usedPtIds.has(ptId))
                continue
            const ptNeibs = pt[1]
            if(ptNeibs && ptNeibs.size > 0){
                const newClusterIds = new Set<number>()
                expandSetInNeighbors(newClusterIds, ptId)
                if(newClusterIds.size > 0){
                    const newCluster:ControlPoint[] = []
                    for(const id of newClusterIds){
                        const addingPt = saveStore.getPtById(id)
                        if(addingPt){
                            newCluster.push(addingPt)
                            usedPtIds.add(id)
                        }
                    }
                    if(newCluster.length > 0)
                        staClusters.value.push(newCluster)
                }
            }
        }
    }
    function expandSetInNeighbors(formingIds:Set<number>, current:number){
        const currentNeibs = neighbors[current]
        if(!currentNeibs)
            return
        for(const neib of currentNeibs){
            if(formingIds.has(neib))
                continue
            formingIds.add(neib)
            expandSetInNeighbors(formingIds, neib)
        }
    }


    function updateClustersBecauseOf(pt:ControlPoint){
        let neibs = neighbors[pt.id]
        if(neibs){
            for(const neib of neibs){
                const neibNeibs = neighbors[neib]
                if(neibNeibs){
                    neibNeibs.delete(pt.id)  
                }
            }
            neibs.clear()
        }else{
            neibs = new Set<number>()
            neighbors[pt.id] = neibs
        }
        if(pt.sta!==ControlPointSta.sta){
            makeClustersFromNeighbors()
            return
        }
        for(const otherPt of saveStore.save?.points||[]){
            if(otherPt.sta !== ControlPointSta.sta || otherPt.id==pt.id)
                continue
            if(ptClinging(pt, otherPt)){
                neibs.add(otherPt.id)
                if(!neighbors[otherPt.id])
                    neighbors[otherPt.id] = new Set<number>()
                neighbors[otherPt.id]?.add(pt.id) 
            }
        }
        makeClustersFromNeighbors()
    }
    function cleanClustersFromDeletedPt(ptId:number){
        const neibs = neighbors[ptId]
        if(!neibs)
            return
        for(const neib of neibs){
            const neibNeibs = neighbors[neib]
            if(neibNeibs){
                neibNeibs.delete(ptId)
            }
        }
        delete neighbors[ptId]
        makeClustersFromNeighbors()
    }

    function ptClinging(a:ControlPoint, b:ControlPoint):boolean{
        const sizeA = saveStore.getLinesDecidedPtSize(a.id)
        const sizeB = saveStore.getLinesDecidedPtSize(b.id)
        const distMut = (sizeA + sizeB)/2
        const clingingDist = configClingingDist * distMut
        const clingingDistSqrBiggerByEpsilon = (clingingDist+numberCmpEpsilon*10)**2 //判断条件应该宽松一些（避免浮点数误差）所以eps*10
        const resBool = !!coordDistSqLessThan(a.pos, b.pos, clingingDistSqrBiggerByEpsilon)
        return resBool
    }

    function tryTransferStaNameWithinCluster(sta:ControlPoint){
        if(!sta.nameP)
            return
        const cluster = getStaClusters()?.find(c=>c.find(s=>s.id === sta.id))
        if(!cluster)
            return
        const nameGlobalPos = coordAdd(sta.pos, sta.nameP)
        let originalDistSq = coordDistSq(sta.pos, nameGlobalPos)
        const transferThrs = 200
        let minDistSq = 1e10
        let closestPt:ControlPoint|undefined;
        cluster.forEach(pt=>{
            if(pt.id == sta.id)
                return
            const distSq = coordDistSq(pt.pos, nameGlobalPos)
            if(distSq < minDistSq){
                minDistSq = distSq;
                closestPt = pt;
            }
        })
        if(closestPt && originalDistSq - minDistSq > transferThrs){
            const relPosToClosest = coordSub(nameGlobalPos, closestPt.pos)
            closestPt.name = sta.name
            closestPt.nameS = sta.nameS
            closestPt.nameP = relPosToClosest
            return closestPt
        }
    }
    function getMaxSizePtWithinCluster(ptId:number, sizeType:'ptSize'|'ptNameSize'){
        const get = sizeType === 'ptSize' 
            ? (id:number)=>saveStore.getLinesDecidedPtSize(id)
            : (id:number)=>saveStore.getLinesDecidedPtNameSize(id)
        const cluster = staBelongToCluster.value[ptId]
        if(!cluster)
            return get(ptId)
        const sizes = cluster.map(x=>get(x.id))
        if(sizes.length===0)
            return 1
        return Math.max(...sizes)
    }
    function getRectOfCluster(cluster: ControlPoint[]|undefined):Coord[] {
        //获取四角点
        if (cluster) {
            const maxXInCluster = Math.max(...cluster.map(x => x.pos[0]))
            const maxYInCluster = Math.max(...cluster.map(x => x.pos[1]))
            const minXInCluster = Math.min(...cluster.map(x => x.pos[0]))
            const minYInCluster = Math.min(...cluster.map(x => x.pos[1]))
            return [
                [maxXInCluster, maxYInCluster],
                [maxXInCluster, minYInCluster],
                [minXInCluster, maxYInCluster],
                [minXInCluster, minYInCluster]
            ]
        }
        return []
    }
    function clearItems(){
        staClusters.value = undefined
        neighbors = {}
    }
    function getStaClusterById(ptId:number){
        let clutser = getStaClusters()?.find(cluster =>
                cluster.some(sta => sta.id === ptId)
            )
        if (!clutser){
            let point = saveStore.getPtById(ptId)
            if (!point) return []
            return [point]
        }
        return clutser
    }
    function getStaName(ptId: number) {
        const cluster = getStaClusterById(ptId)
        let clusterHaveName = cluster.find(x => x.name)
        let res = clusterHaveName?.name
        res = res?.replaceAll('\n', '')
        return res ?? ''
    }

    function isPtSingle(ptId: number) {
        let pt = saveStore.getPtById(ptId)
        if (!pt) {
            return false
        }
        const cluster = getStaClusterById(ptId)
        return cluster.length <= 1
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
        getStaName
    }
})