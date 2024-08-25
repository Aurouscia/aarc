import { useSaveStore } from "../stores/saveStore";
import { useCvs } from "./cvs";
import { ControlPoint, ControlPointDir } from "../save";
import { applyBias, Bias } from "@/utils/coordBias";
import { bareControlPointLineWidth, bareControlPointSize } from "@/utils/consts";

export function usePointCvs(){
    const saveStore = useSaveStore();
    const { cvs, getCtx } = useCvs();
    function renderAllPoints(){
        if(!saveStore.save)
            return
        const allPts = saveStore.save.points
        for(const pt of allPts){
            drawPt(pt)
        }
    }
    function drawPt(pt:ControlPoint){
        const ctx = getCtx()
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
        ctx.lineWidth = bareControlPointLineWidth * 2;
        ctx.strokeStyle = 'white'
        ctx.stroke();
        ctx.lineWidth = bareControlPointLineWidth;
        ctx.strokeStyle = 'black'
        ctx.stroke()
    }
    return { cvs, renderAllPoints }
}