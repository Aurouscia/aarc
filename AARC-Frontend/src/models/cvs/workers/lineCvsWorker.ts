import { LineSeg, useSaveStore } from "../../stores/saveStore";
import { ControlPoint, ControlPointDir } from "../../save";
import { coordRelDiff } from "@/utils/coordRel";
import { lineWidth, turnAreaRadius } from "@/utils/consts";
import { Bias, applyBias } from "@/utils/coordBias";
import { Coord } from "../../coord";
import { coordFill } from "@/utils/coordFill";
import { sgn } from "@/utils/sgn";
import { coordDist } from "@/utils/coordDist";
import { useEnvStore } from "@/models/stores/envStore";

export function useLineCvsWorker(){
    const saveStore = useSaveStore();
    const envStore = useEnvStore();
    function renderAllLines(ctx:CanvasRenderingContext2D){
        if(!saveStore.save){
            return
        }
        const lines = saveStore.save.lines;
        for(const line of lines){
            const pts = saveStore.getPtsByIds(line.pts)
            if(pts.length<=1)
                continue;
            const formalPts = formalize(pts)
            ctx.lineCap = 'round'
            ctx.lineWidth = lineWidth
            ctx.strokeStyle = line.color
            linkPts(formalPts, ctx)
        }
    }
    function renderSegsLine(ctx:CanvasRenderingContext2D, segs:LineSeg[]){
        const activeId = envStore.activePtId;
        if(activeId === undefined)
            return;
        segs.forEach(seg=>{
            const formalPts = formalize(seg.pts)
            ctx.lineCap = 'round'
            ctx.lineWidth = lineWidth
            ctx.strokeStyle = seg.line.color
            linkPts(formalPts, ctx)
        })
    }
    function formalize(pts:ControlPoint[]):Coord[]{
        const formalPts:Coord[] = []
        for(let i=0;i<pts.length-1;i++){
            const a = pts[i]
            const b = pts[i+1]
            if(i===0)
                formalPts.push(a.pos)
            formalPts.push(...formalizeSeg(a, b), b.pos)
        }
        return formalPts
    }
    function formalizeSeg(a:ControlPoint, b:ControlPoint):Coord[]{
        let xDiff = a.pos[0] - b.pos[0]
        let yDiff = a.pos[1] - b.pos[1]
        const rel = coordRelDiff(xDiff, yDiff)
        const pr = rel.posRel
        const rv = rel.rev;
        if(pr == 's')
            return [a.pos];
        if(rel.rev){
            const temp = a;
            a = b;
            b = temp;
            xDiff = -xDiff
            yDiff = -yDiff
        }
        if(a.dir==b.dir){
            if(a.dir==ControlPointDir.incline){
                return coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'midVert')
            }else{
                return coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'midInc')
            }
        }
        if(a.dir==ControlPointDir.incline){
            if(pr == 'luu' || pr == 'uur'){
                return coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'top')
            }else{
                return coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'bottom')
            }
        }else{
            if(pr == 'luu' || pr == 'uur'){
                return coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'bottom')
            }else{
                return coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'top')
            }
        }
    }
    function linkPts(pts:Coord[], ctx:CanvasRenderingContext2D){
        if(pts.length<=1){
            return;
        }
        const first = pts[0]
        const second = pts[1]
        ctx.beginPath()
        ctx.moveTo(first[0], first[1])
        let prevPt:Coord = first
        let prevDist:number = coordDist(first, second);
        for(let i=1;i<pts.length;i++){
            const nowPt = pts[i]
            if(i==pts.length-1){
                ctx.lineTo(nowPt[0], nowPt[1])
                break;
            }
            const nextPt = pts[i+1]
            const nextDist = coordDist(nowPt, nextPt)
            const taRadius = Math.min(turnAreaRadius, prevDist/2, nextDist/2)
            const prevBias:Bias = {
                x:sgn(prevPt[0] - nowPt[0]) as -1|0|1,
                y:sgn(prevPt[1] - nowPt[1]) as -1|0|1,
            }
            const prevSok = applyBias(nowPt, prevBias, taRadius)
            const nextBias:Bias = {
                x:sgn(nextPt[0] - nowPt[0]) as -1|0|1,
                y:sgn(nextPt[1] - nowPt[1]) as -1|0|1,
            }
            const nextSok = applyBias(nowPt, nextBias, taRadius)
            ctx.lineTo(prevSok[0], prevSok[1])
            ctx.quadraticCurveTo(nowPt[0], nowPt[1], nextSok[0], nextSok[1])
            prevDist = nextDist;
            prevPt = nowPt;
        }
        ctx.stroke()
    }
    return { renderAllLines, renderSegsLine }
}