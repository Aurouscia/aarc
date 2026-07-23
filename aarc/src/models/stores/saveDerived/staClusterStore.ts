import { ControlPoint } from "@/models/save";
import { defineStore } from "pinia";
import { useSaveStore } from "../saveStore";
import { useConfigStore } from "../configStore";
<<<<<<< HEAD
import { useFreePtDirectionStore } from "./freePtDirectionStore";
import { computeFreeSnapCandidates } from "@/utils/snapUtils/snapInterPtFree";
import { numberCmpEpsilon } from "@/utils/consts";
=======

>>>>>>> master
import { computed, ref } from "vue";
import { numberCmpEpsilon } from "@/utils/consts";
import { Coord } from '@/models/coord';
import {
    buildNeighbors,
    cleanNeighborsForDeletedPt,
    getClusterMaxSizePure,
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
    const freePtDirectionStore = useFreePtDirectionStore()
    saveStore.deletedPoint = cleanClustersFromDeletedPt
    
    const configClingingDist = cs.config.snapOctaClingPtPtDist

    interface SnapCandidatesInfo {
        candidates: Coord[]
        reach: number
        bbox: { minX: number; maxX: number; minY: number; maxY: number }
    }

    function getCandidatesBbox(candidates: Coord[]): { minX: number; maxX: number; minY: number; maxY: number } {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        for (const c of candidates) {
            if (c[0] < minX) minX = c[0]
            if (c[0] > maxX) maxX = c[0]
            if (c[1] < minY) minY = c[1]
            if (c[1] > maxY) maxY = c[1]
        }
        return { minX, maxX, minY, maxY }
    }

    function bboxesCouldCling(
        bboxA: { minX: number; maxX: number; minY: number; maxY: number },
        bboxB: { minX: number; maxX: number; minY: number; maxY: number },
        dist: number
    ): boolean {
        if (bboxA.minX - bboxB.maxX > dist || bboxB.minX - bboxA.maxX > dist) return false
        if (bboxA.minY - bboxB.maxY > dist || bboxB.minY - bboxA.maxY > dist) return false
        return true
    }

    /**
     * 获取点的吸附候选位置及其在 x/y 轴上的最大偏移（reach）。
     * 对 free 点使用两侧线段方向生成候选（含平行线交点）；
     * 非 free 点退化为 [pt.pos]，reach 为 0。
     */
    function getPtSnapCandidatesAndReach(pt: ControlPoint): SnapCandidatesInfo {
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
<<<<<<< HEAD
            return;
        neighbors = {}
        const snapInfo: Record<number, SnapCandidatesInfo> = {}
        let maxReach = 0
        for (const pt of pts) {
            const info = getPtSnapCandidatesAndReach(pt)
            snapInfo[pt.id] = info
            if (info.reach > maxReach)
                maxReach = info.reach
        }
        // 按 x 坐标排序，用滑动窗口减少 O(n²) 比较
        const sortedPts = pts.slice().sort((a, b) => a.pos[0] - b.pos[0])
        for (let i = 0; i < sortedPts.length - 1; i++) {
            const a = sortedPts[i]
            const reachA = snapInfo[a.id].reach
            const bboxA = snapInfo[a.id].bbox
            for (let j = i + 1; j < sortedPts.length; j++) {
                const b = sortedPts[j]
                const xDiff = b.pos[0] - a.pos[0]
                // x 方向已超出任何可能阈值，后续 j 只会更远
                if (xDiff > skipClingingCheckThrs + reachA + maxReach)
                    break
                const reachB = snapInfo[b.id].reach
                const checkThrs = skipClingingCheckThrs + reachA + reachB
                if (xDiff > checkThrs)
                    continue
                if (Math.abs(a.pos[1] - b.pos[1]) > checkThrs)
                    continue
                if (ptClinging(a, b, snapInfo[a.id].candidates, snapInfo[b.id].candidates, bboxA, snapInfo[b.id].bbox)) {
                    if (!neighbors[a.id])
                        neighbors[a.id] = new Set<number>()
                    if (!neighbors[b.id])
                        neighbors[b.id] = new Set<number>()
                    neighbors[a.id]?.add(b.id)
                    neighbors[b.id]?.add(a.id)
                }
            }
        }
=======
            return
        neighbors = buildNeighbors(
            pts,
            configClingingDist,
            id => saveStore.getLinesDecidedPtSnapSize(id),
            numberCmpEpsilon
        )
>>>>>>> master
    }
    function makeClustersFromNeighbors(){
        staClusters.value = makeClustersFromNeighborsPure(
            neighbors,
            id => saveStore.getPtById(id)
        )
    }

    function updateClustersBecauseOf(pt:ControlPoint){
<<<<<<< HEAD
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
        const ptInfo = getPtSnapCandidatesAndReach(pt)
        for(const otherPt of saveStore.save?.points||[]){
            if(otherPt.sta !== ControlPointSta.sta || otherPt.id==pt.id)
                continue
            const otherInfo = getPtSnapCandidatesAndReach(otherPt)
            const checkThrs = skipClingingCheckThrs + ptInfo.reach + otherInfo.reach
            if(Math.abs(pt.pos[0] - otherPt.pos[0]) > checkThrs)
                continue
            if(Math.abs(pt.pos[1] - otherPt.pos[1]) > checkThrs)
                continue
            if(ptClinging(pt, otherPt, ptInfo.candidates, otherInfo.candidates, ptInfo.bbox, otherInfo.bbox)){
                neibs.add(otherPt.id)
                if(!neighbors[otherPt.id])
                    neighbors[otherPt.id] = new Set<number>()
                neighbors[otherPt.id]?.add(pt.id) 
            }
        }
=======
        neighbors = updateNeighborsForMovedPt(
            neighbors,
            pt,
            saveStore.save?.points || [],
            configClingingDist,
            id => saveStore.getLinesDecidedPtSnapSize(id),
            numberCmpEpsilon
        )
>>>>>>> master
        makeClustersFromNeighbors()
    }
    function cleanClustersFromDeletedPt(ptId:number){
        neighbors = cleanNeighborsForDeletedPt(neighbors, ptId)
        makeClustersFromNeighbors()
    }

<<<<<<< HEAD
    function ptClinging(a:ControlPoint, b:ControlPoint, candidatesA?:Coord[], candidatesB?:Coord[],
        bboxA?:{minX:number; maxX:number; minY:number; maxY:number},
        bboxB?:{minX:number; maxX:number; minY:number; maxY:number}
    ):boolean{
        const sizeA = saveStore.getLinesDecidedPtSnapSize(a.id)
        const sizeB = saveStore.getLinesDecidedPtSnapSize(b.id)
        const distMut = (sizeA + sizeB)/2
        const clingingDist = configClingingDist * distMut
        const clingingDistSqrBiggerByEpsilon = (clingingDist+numberCmpEpsilon*10)**2 //判断条件应该宽松一些（避免浮点数误差）所以eps*10
        let candsA = candidatesA
        let candsB = candidatesB
        let boxA = bboxA
        let boxB = bboxB
        if(candsA === undefined || boxA === undefined){
            const info = getPtSnapCandidatesAndReach(a)
            candsA = info.candidates
            boxA = info.bbox
        }
        if(candsB === undefined || boxB === undefined){
            const info = getPtSnapCandidatesAndReach(b)
            candsB = info.candidates
            boxB = info.bbox
        }
        if(!bboxesCouldCling(boxA, boxB, clingingDist))
            return false
        for(const ca of candsA){
            for(const cb of candsB){
                if(coordDistSqLessThan(ca, cb, clingingDistSqrBiggerByEpsilon))
                    return true
            }
        }
        return false
    }

=======
>>>>>>> master
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
