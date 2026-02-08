import { useConfigStore } from "@/models/stores/configStore"
import { useEnvStore } from "@/models/stores/envStore"
import { defineStore, storeToRefs } from "pinia"
import { CvsContext } from "../common/cvsContext"

export const useCursorCvsWorker = defineStore('cursorCvsWorker', ()=>{
    const cs = useConfigStore()
    const envStore = useEnvStore()
    const { cursorPos } = storeToRefs(envStore)
    let angleNow = 0;
    function renderCursor(ctx: CvsContext, stronger?:boolean) {
        ctx.lineCap = 'round'
        if (!cursorPos.value)
            return;
        let w = cs.config.cursorLineWidth
        let r = cs.config.cursorSize
        if(stronger){
            w *= 2
            r *= 1.5
        }
        renderCursorLayer(ctx, cursorPos.value[0], cursorPos.value[1], r, angleNow, 'white', w * 2)
        renderCursorLayer(ctx, cursorPos.value[0], cursorPos.value[1], r, angleNow, 'black', w)
        angleNow += 0.1
        if(angleNow>2*Math.PI)
            angleNow = 0
    }
    function renderCursorLayer(ctx:CvsContext, x:number, y:number, radius:number, angle:number, style:string, lineWidth:number){
        ctx.strokeStyle = style
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        ctx.arc(x, y, radius, angle, angle+Math.PI/2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x, y, radius, angle + Math.PI, angle+Math.PI*3/2)
        ctx.stroke()
    }
    return { renderCursor }
})