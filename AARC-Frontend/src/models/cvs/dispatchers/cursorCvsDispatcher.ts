import { useEnvStore } from "@/models/stores/envStore";
import { useCvs } from "../common/cvs";
import { storeToRefs } from "pinia";
import { useConfigStore } from "@/models/stores/configStore";

export function useCursorCvsDispatcher(){
    const cs = useConfigStore()
    const { cvs: cursorCvs, getCtx } = useCvs()
    const envStore = useEnvStore()
    const { cursorPos } = storeToRefs(envStore)
    const { getDisplayRatio } = envStore
    let timer = 0;
    let angleNow = 0;
    const pi = Math.PI
    function startRenderCursor(){
        window.clearInterval(timer)
        timer = window.setInterval(()=>{
            const ctx = getCtx()
            ctx.lineCap = 'round'
            if(!cursorPos.value)
                return;
            renderCursor(ctx, cursorPos.value[0], cursorPos.value[1], angleNow, 'white', cs.config.cursorLineWidth*2)
            renderCursor(ctx, cursorPos.value[0], cursorPos.value[1], angleNow, 'black', cs.config.cursorLineWidth)
            angleNow+=0.1
        },50)
    }
    function renderCursor(ctx:CanvasRenderingContext2D, x:number, y:number, angle:number, style:string, lineWidth:number){
        const r = getDisplayRatio()
        ctx.strokeStyle = style
        ctx.lineWidth = lineWidth*r
        ctx.beginPath()
        ctx.arc(x, y, cs.config.cursorSize*r, angle, angle+pi/2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x, y, cs.config.cursorSize*r, angle + pi, angle+pi*3/2)
        ctx.stroke()
    }
    return { cursorCvs, startRenderCursor }
}