import { useSelectionStore } from "@/models/stores/selectionStore";
import { useEnvStore } from "@/models/stores/envStore";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { buildConnectedGraph } from "@/utils/coordUtils/coordGraph";
import { Coord } from "@/models/coord";
import { coordAdd } from "@/utils/coordUtils/coordMath";

export const useSelectionCvsWorker = defineStore('selectionCvsWorker', ()=>{
    const selStore = useSelectionStore()
    const envStore = useEnvStore()
    function renderSelection(ctx:CvsContext){
        const cursor = selStore.selCursor

        // 画涂抹范围
        if(selStore.enabled && cursor){
            let brushColor = 'gray'
            if(selStore.working)
                brushColor = selStore.mode == 'add' ? 'green' : 'palevioletred'
            const r = selStore.brushRadius
            ctx.beginPath()
            ctx.globalAlpha = 1
            ctx.arc(...cursor, r, 0, 2 * Math.PI)
            ctx.lineWidth = 2
            ctx.strokeStyle = brushColor
            ctx.stroke()
            ctx.globalAlpha = 0.3
            ctx.fillStyle = brushColor,
            ctx.fill()
            ctx.globalAlpha = 1
        }

        // 画选中项目标记
        if(selStore.selected.size > 0){
            const coords: Coord[] = []
            selStore.selected.forEach(x=>{
                let isActive = x===envStore.activePt || x===envStore.activeTextTag
                let c = x.pos
                if(!isActive && selStore.draggingDelta){
                    c = coordAdd(x.pos, selStore.draggingDelta)
                }
                coords.push(c)
            })
            const edges = buildConnectedGraph(coords, 0, 0.4)
            ctx.lineWidth = 6
            ctx.strokeStyle = 'black'
            ctx.beginPath()
            for(const e of edges){
                ctx.moveTo(...e[0])
                ctx.lineTo(...e[1])
            }
            const now = Date.now()
            let strong = now % 1000 <= 800
            ctx.globalAlpha = strong ? 0.6 : 0.2
            ctx.stroke()
            ctx.globalAlpha = 1
        }
    }
    return {
        renderSelection
    }
})