import { useSelectionStore } from "@/models/stores/selectionStore";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useEnvStore } from "@/models/stores/envStore";

export const useSelectionCvsWorker = defineStore('selectionCvsWorker', ()=>{
    const selStore = useSelectionStore()
    const envStore = useEnvStore()
    function renderSelection(ctx:CvsContext){
        const cursor = envStore.cursorPos
        if(!selStore.working || !cursor)
            return
        const brushColor = selStore.mode == 'add' ? 'green' : 'palevioletred'
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
    return {
        renderSelection
    }
})