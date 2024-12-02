import { useSaveStore } from "../../stores/saveStore";
import { ControlPoint, ControlPointDir, Line, LineType } from "../../save";
import { coordRelDiff } from "@/utils/coordUtils/coordRel";
import { applyBias } from "@/utils/coordUtils/coordBias";
import { Coord, FormalPt, FormalRay, SgnCoord, twinPts2Ray } from "../../coord";
import { coordFill } from "@/utils/coordUtils/coordFill";
import { sgn } from "@/utils/sgn";
import { coordDist } from "@/utils/coordUtils/coordDist";
import { useEnvStore } from "@/models/stores/envStore";
import { useConfigStore } from "@/models/stores/configStore";
import { FormalizedLine, useFormalizedLineStore } from "@/models/stores/saveDerived/formalizedLineStore";
import { rayIntersect } from "@/utils/rayUtils/rayIntersection";
import { rayPerpendicular, rayRel } from "@/utils/rayUtils/rayParallel";
import { rayRotate90 } from "@/utils/rayUtils/rayRotate";
import { defineStore } from "pinia";
import { ptInLineIndices } from "@/utils/lineUtils/ptInLineIndices";
import { getByIndexInRing, isRing } from "@/utils/lineUtils/isRing";

interface FormalSeg{a:Coord, itp:Coord[], b:Coord, ill?:boolean}
type LineRenderType = 'both'|'body'|'carpet'

export const useLineCvsWorker = defineStore('lineCvsWorker', ()=>{
    const saveStore = useSaveStore();
    const envStore = useEnvStore();
    const formalizedLineStore = useFormalizedLineStore()
    const cs = useConfigStore();
    function renderAllLines(ctx:CanvasRenderingContext2D, needReportFormalPtsLines?:number[], ltype?:LineType, rtype?:LineRenderType){
        if(!saveStore.save){
            return
        }
        const lines = saveStore.save.lines;
        for(const line of lines){
            if(ltype !== undefined){
                if(ltype != line.type)
                    continue
            }
            const needReportFormalPts = !needReportFormalPtsLines || needReportFormalPtsLines.includes(line.id)
            renderLine(ctx, line, needReportFormalPts, rtype)
        }
    }
    function renderLine(ctx:CanvasRenderingContext2D, line:Line, needReportFormalPts?:boolean, rtype?:LineRenderType){
        const pts = saveStore.getPtsByIds(line.pts)
        if(pts.length<=1)
            return;
        const formalPts = formalize(pts)
        if(needReportFormalPts){
            formalizedLineStore.setLinesFormalPts(line.id, formalPts)
        }
        linkPts(ctx, formalPts, line.width)
        doRender(ctx, line, undefined, undefined, rtype)
    }
    function renderSegsAroundActivePt(ctx:CanvasRenderingContext2D)
        :{relatedPts:Iterable<ControlPoint>, formalizedSegs:FormalizedLine[]}
    {
        const activeId = envStore.activePt?.id;
        if(!activeId)
            return{relatedPts:[],formalizedSegs:[]};
        const searchRes:{formalizePtIds:number[], trimLeft:boolean, trimRight:boolean, line:Line}[] = []
        saveStore.save?.lines.forEach(line=>{
            const indices = ptInLineIndices(activeId, line)
            if(indices.length==0)
                return;
            indices.forEach(idx=>{
                const maxIdx = line.pts.length-1
                const formalizePtIds:number[] = []
                let trimLeft = false; let trimRight = false;
                if(isRing(line)){
                    const pm3 = getByIndexInRing(line, idx-3)
                    if(pm3){formalizePtIds.push(pm3);trimLeft = true}
                    const pm2 = getByIndexInRing(line, idx-2)
                    if(pm2){formalizePtIds.push(pm2)}
                    const pm1 = getByIndexInRing(line, idx-1)
                    if(pm1){formalizePtIds.push(pm1)}
                    formalizePtIds.push(line.pts[idx]);
                    const pa1 = getByIndexInRing(line, idx+1)
                    if(pa1){formalizePtIds.push(pa1)}
                    const pa2 = getByIndexInRing(line, idx+2)
                    if(pa2){formalizePtIds.push(pa2)}
                    const pa3 = getByIndexInRing(line, idx+3)
                    if(pa3){formalizePtIds.push(pa3);trimRight = true}
                }else{
                    if(idx-3>=0){formalizePtIds.push(line.pts[idx-3]); trimLeft = true}
                    if(idx-2>=0){formalizePtIds.push(line.pts[idx-2])}
                    if(idx-1>=0){formalizePtIds.push(line.pts[idx-1])}
                    formalizePtIds.push(line.pts[idx]);
                    if(idx+1<=maxIdx){formalizePtIds.push(line.pts[idx+1])}
                    if(idx+2<=maxIdx){formalizePtIds.push(line.pts[idx+2])}
                    if(idx+3<=maxIdx){formalizePtIds.push(line.pts[idx+3]); trimRight = true}
                }
                searchRes.push({formalizePtIds, trimLeft, trimRight, line})
            })
        })
        const relatedPts:Set<ControlPoint> = new Set()
        const formalizedSegs:FormalizedLine[] = []
        searchRes.forEach(res=>{
            const line = res.line
            const fpts = saveStore.getPtsByIds(res.formalizePtIds)
            const formalized = formalize(fpts)
            if(res.trimLeft && formalized.length>0){
                let leftIdx = formalized[0].afterIdxEqv
                const trimCount = formalized.findIndex(x=>x.afterIdxEqv!==leftIdx)
                formalized.splice(0, trimCount)
                fpts.shift()
            }
            if(res.trimRight && formalized.length>1){
                let rightIdx = formalized[formalized.length-2].afterIdxEqv
                const trimFrom = formalized.findIndex(x=>x.afterIdxEqv===rightIdx)
                formalized.splice(trimFrom+1)
                fpts.pop()
            }
            fpts.forEach(pt=>relatedPts.add(pt))
            formalizedSegs.push({lineId:line.id, pts:formalized})
            linkPts(ctx, formalized, line.width)
            const enforceLineWidth = line.isFilled ? 1 : undefined
            doRender(ctx, line, true, enforceLineWidth)
        })
        return {
            relatedPts,
            formalizedSegs
        }
    }
    function formalize(pts:ControlPoint[]):FormalPt[]{
        if(pts.length<2)
            return [];
        const isRingLine = isRing(pts)
        const formalSegs:FormalSeg[] = []
        if(!isRingLine){
            for(let i=0;i<pts.length-1;i++){
                const a = pts[i]
                const b = pts[i+1]
                const seg = formalizeSeg(a, b)
                formalSegs.push(seg)
            }
        }else{
            const a = pts[pts.length-2]
            const b = pts[0]
            const headMarginSeg = formalizeSeg(a, b)
            formalSegs.push(headMarginSeg)
            for(let i=0;i<pts.length-1;i++){
                const a = pts[i]
                const b = pts[i+1]
                const seg = formalizeSeg(a, b)
                formalSegs.push(seg)
            }
            const c = pts[pts.length-1]
            const d = pts[1]
            const tailMarginSeg = formalizeSeg(c, d)
            formalSegs.push(tailMarginSeg)
        }
        //辅助矫正
        illPosedSegJustify(formalSegs)
        if(formalSegs.length==0)
            return []
        if(isRingLine){
            formalSegs.shift()
            formalSegs.pop()
        }
        const formalPts:FormalPt[] = []
        formalPts.push({pos:formalSegs[0].a, afterIdxEqv:0})
        for(let i=0;i<formalSegs.length;i++){
            const seg = formalSegs[i]
            seg.itp.forEach(p=>formalPts.push({pos:p, afterIdxEqv:i}))
            formalPts.push({pos:seg.b, afterIdxEqv:i+1})
        }
        return formalPts
    }
    function formalizeSeg(a:ControlPoint, b:ControlPoint):FormalSeg{
        let xDiff = a.pos[0] - b.pos[0]
        let yDiff = a.pos[1] - b.pos[1]
        const rel = coordRelDiff(xDiff, yDiff)
        const pr = rel.posRel
        const rv = rel.rev;
        if(pr == 's')
            return {a:a.pos, itp:[], b:b.pos};
        const originalA = a;
        const originalB = b;
        if(rel.rev){
            const temp = a;
            a = b;
            b = temp;
            xDiff = -xDiff
            yDiff = -yDiff
        }
        let itp:Coord[]
        let ill = false;
        if(a.dir===b.dir){
            if(a.dir==ControlPointDir.vertical && (pr=='l'||pr=='u')){
                ill = false
            }else if(a.dir==ControlPointDir.incline && (pr=='lu'||pr=='ur')){
                ill = false
            }else{
                ill = true
            }
            if(a.dir==ControlPointDir.incline){
                itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'midVert')
            }else{
                itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'midInc')
            }
        }
        else if(a.dir==ControlPointDir.incline){
            if(pr == 'luu' || pr == 'uur'){
                itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'top')
            }else{
                itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'bottom')
            }
        }else{
            if(pr == 'luu' || pr == 'uur'){
                itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'bottom')
            }else{
                itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'top')
            }
        }
        return {a:originalA.pos, b:originalB.pos, itp, ill}
    }
    function illPosedSegJustify(segs:FormalSeg[]){
        if(segs.length<=1)
            return;

        const illIdxs:number[] = []
        for(let i=0;i<segs.length;i++){
            if(segs[i].ill)
                illIdxs.push(i)
        }
        illIdxs.forEach(i=>{
            const thisSeg = segs[i]
            if(i>0 && i<segs.length-1){
                const prevSeg = segs[i-1]
                const nextSeg = segs[i+1]
                if(!prevSeg.ill && !nextSeg.ill){
                    const prevRef = prevSeg.itp.length==0 ? prevSeg.a : prevSeg.itp[0]
                    const prevRay = twinPts2Ray(prevRef, prevSeg.b)
                    const nextRef = nextSeg.itp.length==0 ? nextSeg.b : nextSeg.itp[0]
                    const nextRay = twinPts2Ray(nextRef, nextSeg.a)
                    const itsc = rayIntersect(prevRay, nextRay, true)
                    if(itsc)
                        thisSeg.itp = [itsc]
                }
            }
            else{
                const func = (neibRef:Coord, share:Coord, thisRef:Coord|null, thisTip:Coord)=>{
                    const neibRay = twinPts2Ray(neibRef, share)
                    let thisRefToShareDist = 1e10; 
                    let thisRay:FormalRay;
                    if(!thisRef){
                        thisRay = {source:thisTip, way:[...neibRay.way]}
                        rayRotate90(thisRay)
                    }else{
                        thisRefToShareDist = coordDist(thisRef, share)
                        thisRay = twinPts2Ray(thisRef, share)
                        thisRay.source = thisTip
                    }
                    if(rayPerpendicular(neibRay, thisRay)){
                        return rayIntersect(neibRay, thisRay, true)
                    }else if(thisRefToShareDist < cs.config.lineTurnAreaRadius){
                        rayRotate90(thisRay)
                        return rayIntersect(neibRay, thisRay, true)
                    }
                }
                let itsc:Coord|undefined
                if(i==segs.length-1){
                    const prevSeg = segs[i-1]
                    if(!prevSeg.ill){
                        const neibRef = prevSeg.itp.length==0 ? prevSeg.a : prevSeg.itp[0]
                        const share = thisSeg.a
                        const thisRef = thisSeg.itp.length>1 ? thisSeg.itp[0] : null
                        const thisTip = thisSeg.b
                        itsc = func(neibRef, share, thisRef, thisTip)
                    }
                }else if(i==0){
                    const nextSeg = segs[i+1]
                    if(!nextSeg.ill){
                        const neibRef = nextSeg.itp.length==0 ? nextSeg.b : nextSeg.itp[0]
                        const share = thisSeg.b
                        const thisRef = thisSeg.itp.length>1 ? thisSeg.itp[1] : null
                        const thisTip = thisSeg.a
                        itsc = func(neibRef, share, thisRef, thisTip)
                    }
                }
                if(itsc){
                    thisSeg.itp = [itsc]
                }
            }
        })
    }
    function linkPts(ctx:CanvasRenderingContext2D, formalPts:FormalPt[], turnRadiusRatio:number|undefined){
        if(formalPts.length<=1){
            return;
        }
        if(!turnRadiusRatio)
            turnRadiusRatio = 1
        const pts = formalPts.map(x=>x.pos)
        const first = pts[0]
        const second = pts[1]
        ctx.beginPath()
        ctx.moveTo(first[0], first[1])
        let prevPt:Coord = first
        let prevToNowRay:FormalRay = twinPts2Ray(first, second)
        let prevDist:number = coordDist(first, second);
        for(let i=1;i<pts.length;i++){
            const nowPt = pts[i]
            if(i==pts.length-1){
                ctx.lineTo(nowPt[0], nowPt[1])
                break;
            }
            const nextPt = pts[i+1]
            const nextDist = coordDist(nowPt, nextPt)
            let turnRadius = cs.config.lineTurnAreaRadius * turnRadiusRatio
            const nowToNextRay = twinPts2Ray(nowPt, nextPt)
            const rel = rayRel(prevToNowRay, nowToNextRay)
            if(rel==='others')
                turnRadius /= 2.4142135*0.618 //tan(67.5°)=2.4142135
            const taRadius = Math.min(turnRadius, prevDist/2, nextDist/2)
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
            ctx.lineTo(...prevSok)
            ctx.quadraticCurveTo(...nowPt, ...nextSok)
            prevDist = nextDist;
            prevToNowRay = nowToNextRay;
            prevPt = nowPt;
        }
    }
    function doRender(ctx:CanvasRenderingContext2D, lineInfo:Line, enforceNoFill?:boolean, enforceLineWidth?:number, type?:LineRenderType){
        const drawCarpet = !type || type==='both' || type==='carpet'
        const drawBody = !type || type==='both' || type==='body'
        if(!lineInfo.isFilled || enforceNoFill){
            const lineWidth = cs.config.lineWidth * (enforceLineWidth||lineInfo.width||1)
            ctx.lineCap = 'round'
            if(drawCarpet){
                const carpetWiden = cs.config.lineWidth * 0.5
                ctx.lineWidth = lineWidth+carpetWiden
                ctx.strokeStyle = cs.config.bgColor
                ctx.stroke()
            }
            if(drawBody){
                ctx.lineWidth = lineWidth
                ctx.strokeStyle = saveStore.getLineActualColor(lineInfo)
                ctx.stroke()
            }
        }else{
            ctx.lineCap = 'round'
            if(drawCarpet){
                const carpetWiden = cs.config.lineWidth * 0.5
                ctx.lineWidth = carpetWiden
                ctx.strokeStyle = cs.config.bgColor
                ctx.stroke()
            }
            if(drawBody){
                ctx.fillStyle = saveStore.getLineActualColor(lineInfo)
                ctx.fill()
            }
        }
    }
    return { renderAllLines, renderLine, renderSegsAroundActivePt }
})