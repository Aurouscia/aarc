import { useSaveStore } from "../../stores/saveStore";
import { ControlPoint, ControlPointDir, Line } from "../../save";
import { coordRelDiff } from "@/utils/coordUtils/coordRel";
import { applyBias } from "@/utils/coordUtils/coordBias";
import { Coord, FormalPt, SgnCoord, twinPts2Ray } from "../../coord";
import { coordFill } from "@/utils/coordUtils/coordFill";
import { sgn } from "@/utils/sgn";
import { coordDist } from "@/utils/coordUtils/coordDist";
import { useEnvStore } from "@/models/stores/envStore";
import { useConfigStore } from "@/models/stores/configStore";
import { useFormalizedLineStore } from "@/models/stores/saveDerived/formalizedLineStore";
import { rayIntersect } from "@/utils/rayUtils/rayIntersection";

export function useLineCvsWorker(){
    const saveStore = useSaveStore();
    const envStore = useEnvStore();
    const formalizedLineStore = useFormalizedLineStore()
    const cs = useConfigStore();
    function renderAllLines(ctx:CanvasRenderingContext2D, needReportFormalPtsLines?:number[]){
        if(!saveStore.save){
            return
        }
        const lines = saveStore.save.lines;
        for(const line of lines){
            const needReportFormalPts = !needReportFormalPtsLines || needReportFormalPtsLines.includes(line.id)
            renderLine(ctx, line, needReportFormalPts)
        }
    }
    function renderLine(ctx:CanvasRenderingContext2D, line:Line, needReportFormalPts?:boolean){
        const pts = saveStore.getPtsByIds(line.pts)
        if(pts.length<=1)
            return;
        const formalPts = formalize(pts)
        if(needReportFormalPts){
            formalizedLineStore.setLinesFormalPts(line.id, formalPts)
        }
        ctx.lineCap = 'round'
        linkPts(ctx, formalPts)
        ctx.lineWidth *= 1.5
        ctx.strokeStyle = cs.config.bgColor
        ctx.stroke()
        ctx.lineWidth = cs.config.lineWidth
        ctx.strokeStyle = line.color
        ctx.stroke()
    }
    function renderSegsAroundActivePt(ctx:CanvasRenderingContext2D):ControlPoint[]{
        const activeId = envStore.activePt?.id;
        if(!activeId)
            return [];
        const searchRes:{formalizePtIds:number[], trimLeft:boolean, trimRight:boolean, line:Line}[] = []
        saveStore.save?.lines.forEach(line=>{
            const idx = line.pts.indexOf(activeId)
            if(idx==-1)
                return;
            const maxIdx = line.pts.length-1
            const formalizePtIds:number[] = []
            let trimLeft = false; let trimRight = false;
            if(idx-3>=0){formalizePtIds.push(line.pts[idx-3]); trimLeft = true}
            if(idx-2>=0){formalizePtIds.push(line.pts[idx-2])}
            if(idx-1>=0){formalizePtIds.push(line.pts[idx-1])}
            formalizePtIds.push(line.pts[idx]);
            if(idx+1<=maxIdx){formalizePtIds.push(line.pts[idx+1])}
            if(idx+2<=maxIdx){formalizePtIds.push(line.pts[idx+2])}
            if(idx+3<=maxIdx){formalizePtIds.push(line.pts[idx+3]); trimRight = true}
            searchRes.push({formalizePtIds, trimLeft, trimRight, line})
        })
        const relatedPts:Set<ControlPoint> = new Set()
        searchRes.forEach(res=>{
            const fpts = saveStore.getPtsByIds(res.formalizePtIds)
            fpts.forEach(pt=>relatedPts.add(pt))
            const formalized = formalize(fpts)
            if(res.trimLeft && formalized.length>0){
                let leftIdx = formalized[0].afterIdxEqv
                const trimCount = formalized.findIndex(x=>x.afterIdxEqv!==leftIdx)
                formalized.splice(0, trimCount)
            }
            if(res.trimRight && formalized.length>1){
                let rightIdx = formalized[formalized.length-2].afterIdxEqv
                const trimFrom = formalized.findIndex(x=>x.afterIdxEqv===rightIdx)
                formalized.splice(trimFrom+1)
            }
            linkPts(ctx, formalized)
            ctx.lineCap = 'round'
            ctx.lineWidth *= 1.5
            ctx.strokeStyle = cs.config.bgColor
            ctx.stroke()
            ctx.lineWidth = cs.config.lineWidth
            ctx.strokeStyle = res.line.color
            ctx.stroke()
        })
        return [...relatedPts]
    }
    function formalize(pts:ControlPoint[]):FormalPt[]{
        if(pts.length<2)
            return [];
        const formalSegs:{a:Coord, itp:Coord[], b:Coord}[] = []
        for(let i=0;i<pts.length-1;i++){
            const a = pts[i]
            const b = pts[i+1]
            const itp = formalizeSeg(a, b)
            formalSegs.push({a:a.pos, itp, b:b.pos})
        }
        //辅助矫正
        illPosedSegJustify(formalSegs)
        if(formalSegs.length==0)
            return []
        const formalPts:FormalPt[] = []
        formalPts.push({pos:formalSegs[0].a, afterIdxEqv:0})
        for(let i=0;i<formalSegs.length;i++){
            const seg = formalSegs[i]
            seg.itp.forEach(p=>formalPts.push({pos:p, afterIdxEqv:i}))
            formalPts.push({pos:seg.b, afterIdxEqv:i+1})
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
    function illPosedSegJustify(segs:{a:Coord, itp:Coord[], b:Coord}[]){
        if(segs.length==0)
            return;

        const illIdxs:number[] = []
        for(let i=0;i<segs.length;i++){
            if(segs[i].itp.length==2)
                illIdxs.push(i)
        }
        illIdxs.forEach(i=>{
            if(i>0 && i<segs.length-1){
                const thisSeg = segs[i]
                const prevSeg = segs[i-1]
                const nextSeg = segs[i+1]
                if(prevSeg.itp.length<2 && nextSeg.itp.length<2){
                    const prevRef = prevSeg.itp.length==0 ? prevSeg.a : prevSeg.itp[0]
                    const prevRay = twinPts2Ray(prevRef, prevSeg.b)
                    const nextRef = nextSeg.itp.length==0 ? nextSeg.b : nextSeg.itp[0]
                    const nextRay = twinPts2Ray(nextRef, nextSeg.a)
                    const itsc = rayIntersect(prevRay, nextRay)
                    if(itsc)
                        thisSeg.itp = [itsc]
                }
            }
        })
    }
    function linkPts(ctx:CanvasRenderingContext2D, formalPts:FormalPt[]){
        if(formalPts.length<=1){
            return;
        }
        const pts = formalPts.map(x=>x.pos)
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
            const taRadius = Math.min(cs.config.lineTurnAreaRadius, prevDist/2, nextDist/2)
            const prevBias:SgnCoord = [
                sgn(prevPt[0] - nowPt[0]) as -1|0|1,
                sgn(prevPt[1] - nowPt[1]) as -1|0|1,
            ]
            const prevSok = applyBias(nowPt, prevBias, taRadius)
            const nextBias:SgnCoord = [
                sgn(nextPt[0] - nowPt[0]) as -1|0|1,
                sgn(nextPt[1] - nowPt[1]) as -1|0|1,
            ]
            const nextSok = applyBias(nowPt, nextBias, taRadius)
            ctx.lineTo(prevSok[0], prevSok[1])
            ctx.quadraticCurveTo(nowPt[0], nowPt[1], nextSok[0], nextSok[1])
            prevDist = nextDist;
            prevPt = nowPt;
        }
    }
    return { renderAllLines, renderLine, renderSegsAroundActivePt }
}