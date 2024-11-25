import { useColorProcStore } from "@/models/stores/colorProcStore";
import { useConfigStore } from "@/models/stores/configStore";
import { useLineExtendStore } from "@/models/stores/saveDerived/saveDerivedDerived/lineExtendStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { drawCross } from "@/utils/drawUtils/drawCross";
import { defineStore } from "pinia";

export const useLineExtendCvsWorker = defineStore('lineExtendCvsWorker', ()=>{
    const { enumerateLineExtendBtns } = useLineExtendStore()
    const { colorProcLineExtend } = useColorProcStore()
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    function renderLineExtend(ctx:CanvasRenderingContext2D){
        enumerateLineExtendBtns((eb)=>{
            const lineColor = saveStore.getLineActualColorById(eb.lineId)
            let extendColor = colorProcLineExtend.convert(lineColor)
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(...eb.rootPos)
            ctx.lineTo(...eb.btnPos)
            ctx.lineWidth = cs.config.lineWidth * 0.6
            ctx.strokeStyle = extendColor
            ctx.stroke()

            ctx.beginPath()
            const staRadius = cs.config.ptStaSize + cs.config.ptStaLineWidth/2
            ctx.arc(...eb.btnPos, staRadius, 0, 2*Math.PI)
            ctx.fillStyle = extendColor
            ctx.fill()
            
            drawCross(ctx, {
                dir: 'vertical',
                pos: eb.btnPos,
                armLength: cs.config.ptStaSize * 0.6,
                repetitions: [{
                    armWidth: cs.config.ptStaLineWidth/2,
                    color: 'white'
                }]
            })
        })
    }
    return { renderLineExtend }
})