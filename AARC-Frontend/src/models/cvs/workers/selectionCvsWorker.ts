import { useSelectionStore } from "@/models/stores/selectionStore";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { buildConnectedGraph } from "@/utils/coordUtils/coordGraph";
import { Coord } from "@/models/coord";

export const useSelectionCvsWorker = defineStore('selectionCvsWorker', ()=>{
    const selStore = useSelectionStore()
    function renderSelection(ctx:CvsContext){
        const cursor = selStore.selCursor
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
        if(selStore.selected.size > 0){
            const coords: Coord[] = []
            selStore.selected.forEach(x=>{
                coords.push(x.pos)
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