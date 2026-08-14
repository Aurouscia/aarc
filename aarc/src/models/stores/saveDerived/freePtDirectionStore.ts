import { computed } from "vue";
import { defineStore } from "pinia";
import { useSaveStore } from "../saveStore";
import { ControlPoint } from "@/models/save";
import { Coord } from "@/models/coord";
import {
    AdjacentSeg as PtAdjacentSeg,
    computePtDirectionInfo,
    PtDirectionInfo
} from "@/utils/ptUtils/ptDirection";

export type { PtDirectionInfo } from "@/utils/ptUtils/ptDirection";

export interface AdjacentSeg {
    prev?: ControlPoint
    next?: ControlPoint
}

export const useFreePtDirectionStore = defineStore('freePtDirection', () => {
    const saveStore = useSaveStore()

    const adjacentSegMap = computed<Record<number, AdjacentSeg | undefined>>(() => {
        const save = saveStore.save
        if (!save) return {}
        const res: Record<number, AdjacentSeg | undefined> = {}
        for (const pt of save.points) {
            if (!pt.free) continue
            const segs = saveStore.adjacentSegs(pt.id)
            const first = segs[0]
            if (!first) continue
            const idx = first.pts.findIndex(p => p.id === pt.id)
            if (idx === -1) continue
            res[pt.id] = {
                prev: first.pts[idx - 1],
                next: first.pts[idx + 1]
            }
        }
        return res
    })

    const directionInfoMap = computed<Record<number, PtDirectionInfo>>(() => {
        const segs = adjacentSegMap.value
        const res: Record<number, PtDirectionInfo> = {}
        for (const [ptIdStr, seg] of Object.entries(segs)) {
            const ptId = Number(ptIdStr)
            const pt = saveStore.getPtById(ptId)
            if (!pt || !seg) continue
            const adjSeg: PtAdjacentSeg = {
                prev: seg.prev ? { pos: seg.prev.pos } : undefined,
                next: seg.next ? { pos: seg.next.pos } : undefined
            }
            res[ptId] = computePtDirectionInfo(pt.pos, adjSeg)
        }
        return res
    })

    function getAdjacentSeg(ptId: number): AdjacentSeg | undefined {
        return adjacentSegMap.value[ptId]
    }

    function getPtDirectionInfo(ptId: number): PtDirectionInfo | undefined {
        return directionInfoMap.value[ptId]
    }

    function getPtDirections(ptId: number): Coord[] {
        return directionInfoMap.value[ptId]?.all ?? []
    }

    return {
        adjacentSegMap,
        directionInfoMap,
        getAdjacentSeg,
        getPtDirectionInfo,
        getPtDirections
    }
})
