import { useSaveStore } from "../../stores/saveStore";
import { ControlPoint, ControlPointDir, ControlPointSta, Line } from "../../save";
import { useConfigStore } from "@/models/stores/configStore";
import { drawCross } from "@/utils/drawUtils/drawCross";

export function usePointCvsWorker(){
    const saveStore = useSaveStore();
    const cs = useConfigStore();
    function renderAllPoints(ctx:CanvasRenderingContext2D){
        if(!saveStore.save)
            return
        const allPts = saveStore.save.points
        for(const pt of allPts){
            renderPoint(ctx, pt)
        }
    }
    function renderLinePoints(ctx:CanvasRenderingContext2D, line:Line){
        const ptIds = line.pts
        if(ptIds && ptIds.length>0){
            const pts = saveStore.save?.points.filter(p=>ptIds.includes(p.id))
            pts?.forEach(p=>renderPoint(ctx, p))
        }
    }
    function renderArrayPoints(ctx:CanvasRenderingContext2D, pts:ControlPoint[], activeId:number){
        pts.forEach(pt=>renderPoint(ctx, pt, activeId == pt.id))
    }
    function renderPointById(ctx:CanvasRenderingContext2D, ptId:number, active:boolean = false){
        const pt = saveStore.getPtById(ptId)
        if(pt)
            renderPoint(ctx, pt, active)
    }
    function renderPoint(ctx:CanvasRenderingContext2D, pt:ControlPoint, active:boolean = false){
        const pos = pt.pos;
        let markColor = '#999'
        if(pt.sta == ControlPointSta.plain || active){
            const dir = pt.dir === ControlPointDir.incline ? 'incline':'vertical'
            let markSize = cs.config.ptBareSize;
            let markWidth = cs.config.ptBareLineWidth;
            if(active){
                markSize *= 1.8
                markColor = '#000'
            }
            drawCross(ctx, {
                pos,
                dir,
                armLength: markSize,
                repetitions: [
                    {
                        armWidth: markWidth*2,
                        color: cs.config.bgColor
                    },{
                        armWidth: markWidth,
                        color: markColor
                    }
                ]
            })
        }
        if(pt.sta === ControlPointSta.sta){
            const relatedLines = saveStore.getLinesByPt(pt.id)
            if(relatedLines.length==1 && !active){
                ctx.strokeStyle = relatedLines[0].color
            }else{
                ctx.strokeStyle = markColor

                ctx.beginPath()
                ctx.fillStyle = cs.config.bgColor
                ctx.arc(pos[0], pos[1], cs.config.ptStaSize + cs.config.ptStaLineWidth, 0, 2*Math.PI)
                ctx.fill()
            }
            ctx.beginPath()
            ctx.lineWidth = cs.config.ptStaLineWidth
            ctx.fillStyle = cs.config.ptStaFillColor
            ctx.arc(pos[0], pos[1], cs.config.ptStaSize, 0, 2*Math.PI)
            ctx.fill()
            ctx.stroke()
        }
    }
    return { renderAllPoints, renderLinePoints, renderArrayPoints, renderPoint, renderPointById }
}