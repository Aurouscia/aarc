import { LineSeg, useSaveStore } from "../../stores/saveStore";
import { ControlPoint, ControlPointDir, ControlPointSta, Line } from "../../save";
import { applyBias } from "@/utils/coordUtils/coordBias";
import { SgnCoord } from "@/models/coord";
import { useConfigStore } from "@/models/stores/configStore";

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
    function renderSegsPoints(ctx:CanvasRenderingContext2D, segs:LineSeg[], activeId:number){
        segs.forEach(seg=>{
            seg.pts.forEach(pt=>renderPoint(ctx, pt, activeId == pt.id))
        })
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
            ctx.lineCap = 'round'
            let biasA1:SgnCoord, biasA2:SgnCoord, biasB1:SgnCoord, biasB2:SgnCoord;
            if(pt.dir === ControlPointDir.incline){
                biasA1 = [-1, -1]
                biasA2 = [1, 1]
                biasB1 = [-1, 1]
                biasB2 = [1, -1]
            }else{
                biasA1 = [-1, 0]
                biasA2 = [1, 0]
                biasB1 = [0, -1]
                biasB2 = [0, 1]
            }
            let markSize = cs.config.ptBareSize;
            let markWidth = cs.config.ptBareLineWidth;
            if(active){
                markSize *= 1.8
                markColor = '#000'
            }
            const a1 = applyBias(pos, biasA1, markSize)
            const a2 = applyBias(pos, biasA2, markSize)
            const b1 = applyBias(pos, biasB1, markSize)
            const b2 = applyBias(pos, biasB2, markSize)
            ctx.beginPath()
            ctx.moveTo(a1[0], a1[1])
            ctx.lineTo(a2[0], a2[1])
            ctx.moveTo(b1[0], b1[1])
            ctx.lineTo(b2[0], b2[1])
            ctx.lineWidth = markWidth * 2;
            ctx.strokeStyle = 'white'
            ctx.stroke();
            ctx.lineWidth = markWidth;
            ctx.strokeStyle = markColor
            ctx.stroke()
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
    return { renderAllPoints, renderLinePoints, renderSegsPoints, renderPoint, renderPointById }
}