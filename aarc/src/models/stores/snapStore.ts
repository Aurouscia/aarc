import { Coord, FreeRay } from "@/models/coord";
import { useSaveStore } from "./saveStore";
import { ControlPoint } from "@/models/save";
import { defineStore, storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useConfigStore } from "./configStore";
import { useStaClusterStore } from "./saveDerived/staClusterStore";
import { useEditorLocalConfigStore } from "@/app/localConfig/editorLocalConfig";
import {
    calcStaNameSnapCandidates,
    snapGrid as snapGridCore,
    snapInterPt as snapInterPtCore,
    snapNameToCandidates,
    snapNeighborExtends as snapNeighborExtendsCore,
    getNameSnapStatus
} from "@/utils/snapUtils/snapCore";
import { useFreePtDirectionStore } from "./saveDerived/freePtDirectionStore";
import { computeFreeNameSnapCandidates } from "@/utils/snapUtils/snapNameFree";

export const useSnapStore = defineStore('snap',()=>{
    const cs = useConfigStore()
    const saveStore = useSaveStore()
    const { getLinesDecidedPtSnapSizes } = saveStore
    const staClusterStore = useStaClusterStore()
    const editorLocalConfig = useEditorLocalConfigStore()
    const freePtDirectionStore = useFreePtDirectionStore()
    const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
    const snapLines = ref<FreeRay[]>([])
    const snapGridIntv = ref<number>()
    const snappingNamePtId = ref<number>()
    const snapStaNameTo = computed<Coord[]>(()=>
        getStaNameSnapPoss(snappingNamePtId.value || -1))
    //站名吸附目标位置（相对站心的偏移）；free 点仅吸附线路法向位置
    function getStaNameSnapPoss(ptId:number):Coord[]{
        const distRatio = staClusterStore.getMaxSizePtWithinCluster(ptId, 'ptNameSnapSize')
        const pt = saveStore.getPtById(ptId)
        if (pt?.free) {
            const dirs = freePtDirectionStore.getPtDirections(ptId)
            if (dirs.length > 0) {
                return computeFreeNameSnapCandidates(dirs, cs.config.snapOctaClingPtNameDist * distRatio)
            }
            //孤立/无方向 free 点：回退到标准候选
        }
        return calcStaNameSnapCandidates(
            cs.config.snapOctaClingPtNameDist,
            distRatio,
            editorLocalConfig.staNameSnapDiagonal
        )
    }
    const snapNeighborExtendsOnlySameDir = ref<boolean>(false)
    const snapInterPtTargets = ref<{snapPoss:Coord[], snapToPts:ControlPoint[], matched?:Coord}>()
    function snap(pt:ControlPoint):Coord|undefined{
        snapLines.value = []
        const interPtNoBias = !snapInterPtEnabled.value
        const interPtRes = snapInterPt(pt, interPtNoBias)
        if(interPtRes){
            return interPtRes
        }
        let neibRes:Coord|undefined = undefined
        let freeWay:Coord|undefined = undefined
        if(snapNeighborExtendsEnabled.value){
            const neibExtend = snapNeighborExtends(pt)
            neibRes = neibExtend.snapRes
            freeWay = neibExtend.freeWay
            if(neibRes && (!freeWay || !snapGridEnabled.value)){
                return neibRes
            }
        }
        if(snapGridEnabled.value){
            const gridRes = snapGrid(neibRes || pt.pos, freeWay)
            if(gridRes){
                return gridRes
            }
        }
    }
    function snapName(pt:ControlPoint):{to:Coord,type:'vague'|'accu'}|undefined{
        if(!pt.nameP){
            return;
        }
        snappingNamePtId.value = pt.id
        return snapNameToCandidates(
            pt,
            snapStaNameTo.value,
            cs.snapOctaClingPtNameThrsSq,
            cs.config.snapOctaRayPtNameThrs,
            getFreeNameSnapDirs(pt)
        )
    }
    function snapNameStatus(pt:ControlPoint):{type:'vague'|'accu'}|undefined{
        return getNameSnapStatus(pt, snapStaNameTo.value, undefined, getFreeNameSnapDirs(pt))
    }
    //free 点站名 vague 吸附使用的线路方向集合；无方向时返回 undefined（回退轴线归零）
    function getFreeNameSnapDirs(pt:ControlPoint):Coord[]|undefined{
        if (!pt.free)
            return undefined
        const dirs = freePtDirectionStore.getPtDirections(pt.id)
        return dirs.length > 0 ? dirs : undefined
    }
    function snapNeighborExtends(pt:ControlPoint):{snapRes?:Coord, freeWay?:Coord}{
        const { snapRes, freeWay, snapLines: lines } = snapNeighborExtendsCore(
            pt,
            saveStore.getNeighborByPt(pt.id),
            cs.config.snapOctaRayPtPtThrs,
            snapNeighborExtendsOnlySameDir.value,
            cs.config.snapRayAngles,
            cs.config.snapRayAnglesForFree
        )
        snapLines.value.push(...lines)
        return { snapRes, freeWay }
    }
    function snapInterPt(pt:ControlPoint, noBias:boolean):Coord|undefined{
        const ptSnapSizes = getLinesDecidedPtSnapSizes(pt.id) || [1]
        const ptSnapSizeLargest = Math.max(...ptSnapSizes)
        const snapDistLargest = ptSnapSizeLargest * cs.config.snapOctaClingPtPtDist
        const snapThrs = cs.config.snapOctaClingPtPtThrs;
        const pts = saveStore.getPtsInRange(pt.pos, (snapDistLargest + snapThrs)*2, pt.id)
        //free=true的同线邻点（上一个/下一个点）不提供吸附点
        const freeNeighborIds = new Set(
            saveStore.getNeighborByPt(pt.id).filter(n=>n.free).map(n=>n.id))
        const ptsFiltered = freeNeighborIds.size>0
            ? pts.filter(p=>!freeNeighborIds.has(p.id))
            : pts
        const getPtDirectionInfo = (id: number) => freePtDirectionStore.getPtDirectionInfo(id)
        const { matched, targets } = snapInterPtCore(
            pt,
            ptsFiltered,
            {
                snapDistBase: cs.config.snapOctaClingPtPtDist,
                snapThrs
            },
            getLinesDecidedPtSnapSizes,
            noBias,
            getPtDirectionInfo
        )
        snapInterPtTargets.value = { ...targets, matched }
        return matched
    }
    function snapGrid(ptPos:Coord, freeWay?:Coord, clearSnapLines?:boolean, ensureSnap?:boolean):Coord|undefined{
        if(clearSnapLines)
            snapLines.value = []
        if(!snapGridEnabled.value)
            return;
        const intv = snapGridIntv.value
        if(!intv)
            return;
        const res = snapGridCore(
            ptPos,
            intv,
            cvsWidth.value,
            cvsHeight.value,
            freeWay,
            cs.config.snapGridThrs,
            ensureSnap
        )
        if(res){
            snapLines.value.push(...res.snapLines)
            return res.pos
        }
    }

    const snapInterPtEnabled = ref(true)
    const snapNeighborExtendsEnabled = ref(true)
    const snapGridEnabled = ref(true)
    return {
        snap, snapName, snapNameStatus, snapGrid,
        getStaNameSnapPoss,
        snapLines, snapGridIntv, snapNeighborExtendsOnlySameDir,
        snapInterPtEnabled, snapNeighborExtendsEnabled, snapGridEnabled,
        snapInterPtTargets
    }
})