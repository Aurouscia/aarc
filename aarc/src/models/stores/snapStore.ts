import { Coord, FormalRay, SgnCoord } from "@/models/coord";
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

export const useSnapStore = defineStore('snap',()=>{
    const cs = useConfigStore()
    const saveStore = useSaveStore()
    const { getLinesDecidedPtSnapSizes } = saveStore
    const staClusterStore = useStaClusterStore()
    const editorLocalConfig = useEditorLocalConfigStore()
    const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
    const snapLines = ref<FormalRay[]>([])
    const snapGridIntv = ref<number>()
    const snappingNamePtId = ref<number>()
    const snapStaNameTo = computed<Coord[]>(()=>{
        const ptId = snappingNamePtId.value || -1
        const distRatio = staClusterStore.getMaxSizePtWithinCluster(ptId, 'ptNameSnapSize')
        return calcStaNameSnapCandidates(
            cs.config.snapOctaClingPtNameDist,
            distRatio,
            editorLocalConfig.staNameSnapDiagonal
        )
    })
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
        let freeAxis:SgnCoord|undefined = undefined
        if(snapNeighborExtendsEnabled.value){
            const neibExtend = snapNeighborExtends(pt)
            neibRes = neibExtend.snapRes
            freeAxis = neibExtend.freeAxis
            if(neibRes && (!freeAxis || !snapGridEnabled.value)){
                return neibRes
            }
        }
        if(snapGridEnabled.value){
            const gridRes = snapGrid(neibRes || pt.pos, freeAxis)
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
    function snapNeighborExtends(pt:ControlPoint):{snapRes?:Coord, freeAxis?:SgnCoord}{
        const { snapRes, freeAxis, snapLines: lines } = snapNeighborExtendsCore(
            pt,
            saveStore.getNeighborByPt(pt.id),
            cs.config.snapOctaRayPtPtThrs,
            snapNeighborExtendsOnlySameDir.value
        )
        snapLines.value.push(...lines)
        return { snapRes, freeAxis }
    }
    function snapInterPt(pt:ControlPoint, noBias:boolean):Coord|undefined{
        const ptSnapSizes = getLinesDecidedPtSnapSizes(pt.id) || [1]
        const ptSnapSizeLargest = Math.max(...ptSnapSizes)
        const snapDistLargest = ptSnapSizeLargest * cs.config.snapOctaClingPtPtDist
        const snapThrs = cs.config.snapOctaClingPtPtThrs;
        const pts = saveStore.getPtsInRange(pt.pos, (snapDistLargest + snapThrs)*2, pt.id)
        const { matched, targets } = snapInterPtCore(
            pt,
            pts,
            {
                snapDistBase: cs.config.snapOctaClingPtPtDist,
                snapThrs
            },
            getLinesDecidedPtSnapSizes,
            noBias
        )
        snapInterPtTargets.value = { ...targets, matched }
        return matched
    }
    function snapGrid(ptPos:Coord, freeAxis?:SgnCoord, clearSnapLines?:boolean, ensureSnap?:boolean):Coord|undefined{
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
            freeAxis,
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
        snapLines, snapGridIntv, snapNeighborExtendsOnlySameDir,
        snapInterPtEnabled, snapNeighborExtendsEnabled, snapGridEnabled,
        snapInterPtTargets
    }
})