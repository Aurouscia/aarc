import { useSaveStore } from "../../stores/saveStore";
import { ControlPoint, ControlPointDir, ControlPointSta, Line } from "../../save";
import { useConfigStore } from "@/models/stores/configStore";
import { drawCross } from "@/utils/drawUtils/drawCross";
import { defineStore } from "pinia";

export const usePointCvsWorker = defineStore('pointCvsWorker', ()=>{
    const saveStore = useSaveStore();
    const cs = useConfigStore();
    function renderAllPoints(ctx:CanvasRenderingContext2D, onlyVisiblePts?:boolean){
        if(!saveStore.save)
            return
        const allPts = saveStore.save.points
        for(const pt of allPts){
            renderPoint(ctx, pt, false, onlyVisiblePts)
        }
    }
    function renderLinePoints(ctx:CanvasRenderingContext2D, line:Line){
        const ptIds = line.pts
        if(ptIds && ptIds.length>0){
            const pts = saveStore.save?.points.filter(p=>ptIds.includes(p.id))
            pts?.forEach(p=>renderPoint(ctx, p))
        }
    }
    function renderSomePoints(ctx:CanvasRenderingContext2D, pts:Iterable<ControlPoint>, activeId:number){
        for(const pt of pts){
            renderPoint(ctx, pt, activeId == pt.id)
        }
    }
    function renderPointById(ctx:CanvasRenderingContext2D, ptId:number, active:boolean = false){
        const pt = saveStore.getPtById(ptId)
        if(pt)
            renderPoint(ctx, pt, active)
    }
    function renderPoint(ctx:CanvasRenderingContext2D, pt:ControlPoint, active:boolean = false, staOnly:boolean = false){
        const pos = pt.pos;
        let markColor = '#999'
        //TODO：性能优化
        const relatedLines = saveStore.getLinesByPt(pt.id)
        if(relatedLines.every(x=>saveStore.isLineTypeWithoutSta(x.type)))
            pt.sta = ControlPointSta.plain //自动设置车站类型
        let staType = pt.sta
        if(staType !== ControlPointSta.sta && staOnly)
            return
        if(staType === ControlPointSta.plain || active){
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
        if(staType === ControlPointSta.sta){
            let maxWidth = Math.max(...relatedLines.map(x=>x.width || 1))
            if(maxWidth > 1)
                maxWidth = 1
            const arcRadius = cs.config.ptStaSize * maxWidth
            if(relatedLines.length==1 && !active){
                ctx.strokeStyle = saveStore.getLineActualColor(relatedLines[0])
            }else{
                ctx.strokeStyle = markColor
                ctx.beginPath()
                ctx.fillStyle = cs.config.bgColor
                ctx.arc(pos[0], pos[1], arcRadius + cs.config.ptStaLineWidth, 0, 2*Math.PI)
                ctx.fill()
            }
            ctx.beginPath()
            ctx.lineWidth = cs.config.ptStaLineWidth
            ctx.fillStyle = cs.config.ptStaFillColor
            ctx.arc(pos[0], pos[1], arcRadius, 0, 2*Math.PI)
            ctx.fill()
            ctx.stroke()
        }
    }
    return { renderAllPoints, renderLinePoints, renderSomePoints, renderPoint, renderPointById }
})