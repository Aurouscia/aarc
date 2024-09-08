import { LineSeg, useSaveStore } from "../../stores/saveStore";
import { ControlPoint, ControlPointDir, ControlPointSta, Line } from "../../save";
import { applyBias } from "@/utils/coordBias";
import { bareControlPointLineWidthR, bareControlPointSizeR, bgColor, staFillColor, staLineWidthR, staSizeR } from "@/utils/consts";
import { useEnvStore } from "@/models/stores/envStore";
import { SgnCoord } from "@/models/coord";

export function usePointCvsWorker(){
    const saveStore = useSaveStore();
    const { getDisplayRatio } = useEnvStore()
    function renderAllPoints(ctx:CanvasRenderingContext2D){
        if(!saveStore.save)
            return
        const allPts = saveStore.save.points
        for(const pt of allPts){
            drawPt(ctx, pt)
        }
    }
    function renderLinePoints(ctx:CanvasRenderingContext2D, line:Line){
        const ptIds = line.pts
        if(ptIds && ptIds.length>0){
            const pts = saveStore.save?.points.filter(p=>ptIds.includes(p.id))
            pts?.forEach(p=>drawPt(ctx, p))
        }
    }
    function renderSegsPoints(ctx:CanvasRenderingContext2D, segs:LineSeg[], activeId:number){
        segs.forEach(seg=>{
            seg.pts.forEach(pt=>drawPt(ctx, pt, activeId == pt.id))
        })
    }
    function drawPt(ctx:CanvasRenderingContext2D, pt:ControlPoint, active:boolean = false){
        let r = getDisplayRatio()
        if(r>1.6)
            return
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
            let markSize = bareControlPointSizeR * r;
            let markWidth = bareControlPointLineWidthR * r;
            if(active){
                markSize *= 1.5
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
                ctx.fillStyle = bgColor
                ctx.arc(pos[0], pos[1], staSizeR+staLineWidthR, 0, 2*Math.PI)
                ctx.fill()
            }
            ctx.beginPath()
            ctx.lineWidth = staLineWidthR
            ctx.fillStyle = staFillColor
            ctx.arc(pos[0], pos[1], staSizeR, 0, 2*Math.PI)
            ctx.fill()
            ctx.stroke()
        }
    }
    return { renderAllPoints, renderLinePoints, renderSegsPoints }
}