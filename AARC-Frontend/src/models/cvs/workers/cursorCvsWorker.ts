import { useConfigStore } from "@/models/stores/configStore"
import { useEnvStore } from "@/models/stores/envStore"
import { defineStore, storeToRefs } from "pinia"

export const useCursorCvsWorker = defineStore('cursorCvsWorker', ()=>{
    const cs = useConfigStore()
    const envStore = useEnvStore()
    const { cursorPos } = storeToRefs(envStore)
    let angleNow = 0;
    function renderCursor(ctx: CanvasRenderingContext2D) {
        ctx.lineCap = 'round'
        if (!cursorPos.value)
            return;
        renderCursorLayer(ctx, cursorPos.value[0], cursorPos.value[1], angleNow, 'white', cs.config.cursorLineWidth * 2)
        renderCursorLayer(ctx, cursorPos.value[0], cursorPos.value[1], angleNow, 'black', cs.config.cursorLineWidth)
        angleNow += 0.1
        if(angleNow>2*Math.PI)
            angleNow = 0
    }
    function renderCursorLayer(ctx:CanvasRenderingContext2D, x:number, y:number, angle:number, style:string, lineWidth:number){
        const r = 1
        ctx.strokeStyle = style
        ctx.lineWidth = lineWidth*r
        ctx.beginPath()
        ctx.arc(x, y, cs.config.cursorSize*r, angle, angle+Math.PI/2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x, y, cs.config.cursorSize*r, angle + Math.PI, angle+Math.PI*3/2)
        ctx.stroke()
    }
    return { renderCursor }
})