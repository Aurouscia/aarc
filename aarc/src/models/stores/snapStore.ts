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
    //站名吸附目标位置（相对站心的偏移），8个方向各至少一个
    function getStaNameSnapPoss(ptId:number):Coord[]{
        const distRatio = staClusterStore.getMaxSizePtWithinCluster(ptId, 'ptNameSnapSize')
<<<<<<< HEAD
        return calcStaNameSnapCandidates(
            cs.config.snapOctaClingPtNameDist,
            distRatio,
            editorLocalConfig.staNameSnapDiagonal
        )
    })
=======
        const snd = cs.config.snapOctaClingPtNameDist * distRatio;
        const sndh = snd * sqrt2half;
        const diagonal = editorLocalConfig.staNameSnapDiagonal;
        const res: Coord[] = [
            [snd,0],[-snd,0],[0,snd],[0,-snd],           // 正交 4 方向
        ];
        if (diagonal === 'inner' || diagonal === 'both') {
            res.push(
                [sndh,sndh],[sndh,-sndh],[-sndh,sndh],[-sndh,-sndh]  // 内侧对角 4 方向（距离 = snd）
            );
        }
        if (diagonal === 'outer' || diagonal === 'both') {
            res.push(
                [snd,snd],[snd,-snd],[-snd,snd],[-snd,-snd]   // 外侧对角 4 方向（距离 = snd*√2）
            );
        }
        return res;
    }
>>>>>>> master
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
            cs.config.snapOctaRayPtNameThrs
        )
    }
    function snapNameStatus(pt:ControlPoint):{type:'vague'|'accu'}|undefined{
        return getNameSnapStatus(pt, snapStaNameTo.value)
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
        const getPtDirectionInfo = (id: number) => freePtDirectionStore.getPtDirectionInfo(id)
        const { matched, targets } = snapInterPtCore(
            pt,
            pts,
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