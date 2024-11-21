import { useConfigStore } from "@/models/stores/configStore";
import { useLineExtendStore } from "@/models/stores/saveDerived/saveDerivedDerived/lineExtendStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { drawCross } from "@/utils/drawUtils/drawCross";

export function useLineExtendCvsWorker(){
    const { enumerateLineExtendBtns } = useLineExtendStore()
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    function renderLineExtend(ctx:CanvasRenderingContext2D){
        enumerateLineExtendBtns((eb)=>{
            const lineColor = saveStore.getLineById(eb.lineId)?.color || '#ccc'
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(...eb.rootPos)
            ctx.lineTo(...eb.btnPos)
            ctx.lineWidth *= 1.5
            ctx.strokeStyle = cs.config.bgColor
            ctx.stroke()
            ctx.lineWidth = cs.config.lineWidth
            ctx.strokeStyle = lineColor
            ctx.stroke()

            ctx.beginPath()
            const staRadius = cs.config.ptStaSize + cs.config.ptStaLineWidth/2
            ctx.arc(...eb.btnPos, staRadius, 0, 2*Math.PI)
            ctx.fillStyle = lineColor
            ctx.fill()
            
            drawCross(ctx, {
                dir: 'vertical',
                pos: eb.btnPos,
                armLength: cs.config.ptStaSize * 0.6,
                repetitions: [{
                    armWidth: cs.config.ptStaLineWidth,
                    color: 'white'
                }]
            })
        })
    }
    return { renderLineExtend }
}