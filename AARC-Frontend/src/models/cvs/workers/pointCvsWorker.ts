import { LineSeg, useSaveStore } from "../../stores/saveStore";
import { ControlPoint, ControlPointDir } from "../../save";
import { applyBias, Bias } from "@/utils/coordBias";
import { bareControlPointLineWidth, bareControlPointSize } from "@/utils/consts";

export function usePointCvsWorker(){
    const saveStore = useSaveStore();
    function renderAllPoints(ctx:CanvasRenderingContext2D){
        if(!saveStore.save)
            return
        const allPts = saveStore.save.points
        for(const pt of allPts){
            drawPt(ctx, pt)
        }
    }
    function renderSegsPoints(ctx:CanvasRenderingContext2D, segs:LineSeg[], activeId:number){
        segs.forEach(seg=>{
            seg.pts.forEach(pt=>drawPt(ctx, pt, activeId == pt.id))
        })
    }
    function drawPt(ctx:CanvasRenderingContext2D, pt:ControlPoint, active:boolean = false){
        const pos = pt.pos
        let biasA1:Bias, biasA2:Bias, biasB1:Bias, biasB2:Bias;
        if(pt.dir === ControlPointDir.incline){
            biasA1 = {x:-1, y:-1}
            biasA2 = {x:1, y:1}
            biasB1 = {x:-1, y:1}
            biasB2 = {x:1, y:-1}
        }else{
            biasA1 = {x:-1, y:0}
            biasA2 = {x:1, y:0}
            biasB1 = {x:0, y:-1}
            biasB2 = {x:0, y:1}
        }
        const a1 = applyBias(pos, biasA1, bareControlPointSize)
        const a2 = applyBias(pos, biasA2, bareControlPointSize)
        const b1 = applyBias(pos, biasB1, bareControlPointSize)
        const b2 = applyBias(pos, biasB2, bareControlPointSize)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(a1[0], a1[1])
        ctx.lineTo(a2[0], a2[1])
        ctx.moveTo(b1[0], b1[1])
        ctx.lineTo(b2[0], b2[1])
        if(active){
            const radius = bareControlPointSize*0.8
            ctx.moveTo(pos[0]+radius, pos[1])
            ctx.arc(pos[0], pos[1], radius, 0, 2*Math.PI)
        }
        ctx.lineWidth = bareControlPointLineWidth * 2;
        ctx.strokeStyle = 'white'
        ctx.stroke();
        ctx.lineWidth = bareControlPointLineWidth;
        ctx.strokeStyle = 'black'
        ctx.stroke()
    }
    return { renderAllPoints, renderSegsPoints }
}