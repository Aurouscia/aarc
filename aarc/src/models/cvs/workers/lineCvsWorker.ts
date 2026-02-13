import { useSaveStore } from "../../stores/saveStore";
import { ControlPoint, ControlPointDir, Line, LineType } from "../../save";
import { coordRelDiff } from "@/utils/coordUtils/coordRel";
import { applyBias } from "@/utils/coordUtils/coordBias";
import { Coord, FormalPt, FormalRay, twinPts2Ray, twinPts2SgnCoord } from "../../coord";
import { coordFill } from "@/utils/coordUtils/coordFill";
import { coordDist } from "@/utils/coordUtils/coordDist";
import { useEnvStore } from "@/models/stores/envStore";
import { useConfigStore } from "@/models/stores/configStore";
import { FormalizedLine, useFormalizedLineStore } from "@/models/stores/saveDerived/formalizedLineStore";
import { rayIntersect } from "@/utils/rayUtils/rayIntersection";
import { rayPerpendicular, rayRel } from "@/utils/rayUtils/rayParallel";
import { rayRotate90 } from "@/utils/rayUtils/rayRotate";
import { defineStore } from "pinia";
import { ptInLineIndices } from "@/utils/lineUtils/ptInLineIndices";
import { getByIndexInRing, isRing, isRingByFormalPts } from "@/utils/lineUtils/isRing";
import { drawArcByThreePoints } from "@/utils/drawUtils/drawArc";
import { CvsContext } from "../common/cvsContext";
import { strokeStyledLine } from "../common/strokeStyledLine";
import { rayToCoordDist } from "@/utils/rayUtils/rayToCoordDist";
import { numberCmpEpsilon } from "@/utils/consts";
import { useLineStateStore } from "@/models/stores/saveDerived/state/lineStateStore";
import { useColorProcStore } from "@/models/stores/utils/colorProcStore";

interface FormalSeg{a:Coord, itp:Coord[], b:Coord, ill:number}
type LineRenderType = 'both'|'body'|'carpet'

export const useLineCvsWorker = defineStore('lineCvsWorker', ()=>{
    const saveStore = useSaveStore();
    const lineStateStore = useLineStateStore()
    const envStore = useEnvStore();
    const formalizedLineStore = useFormalizedLineStore()
    const cs = useConfigStore();
    const colorProc = useColorProcStore()
    function renderAllLines(ctx:CvsContext, needReportFormalPtsLines?:number[], ltype?:LineType, rtype?:LineRenderType){
        if(!saveStore.save){
            return
        }
        ctx.lineJoin = 'round'
        const lines = saveStore.linesSortedByZIndex;
        for(const line of lines){
            if(line.parent) //TODO:确保parent要么falsy，要么指向一个存在的线路，不能有dangling情况
                continue
            if(ltype !== undefined){
                if(ltype != line.type)
                    continue
            }
            let toRender = [line]
            const children = saveStore.getLinesByParent(line.id)
            if(children)
                toRender.push(...children)
            renderLine(ctx, toRender, needReportFormalPtsLines, rtype)
        }
    }
    /**
     * 渲染某个线路（可选择“及其支线”）
     * @param ctx 
     * @param line 线路（单个或数组，如果是数组，应为x线路及其支线（x和parent设为x.id的线路））
     * @param needReportFormalPts 需要更新formalPts
     * @param rtype 渲染类型（地毯/本体）
     * @returns 
     */
    function renderLine(ctx:CvsContext, line:Line|Line[], needReportFormalPtsLines?:number[], rtype?:LineRenderType){
        if(!(line instanceof Array)){
            line = [line]
        }
        if(line.length===0)
            return
        const lineInfo = line[0]
        ctx.beginPath()
        for(const l of line){
            const pts = saveStore.getPtsByIds(l.pts)
            if(pts.length<=1)
                return;
            const needReportFormalPts = !needReportFormalPtsLines || needReportFormalPtsLines.includes(l.id)
            const formalPts = formalize(pts) //TODO: needReportFormalPts参数可以不要，即使跳过了formalize也几乎没有优化
            if(needReportFormalPts){
                formalizedLineStore.setLinesFormalPts(l.id, formalPts)
            }
            linkPts(ctx, formalPts, l)
        }
        doRender(ctx, lineInfo, undefined, undefined, rtype)
    }
    function renderSegsAroundActivePt(ctx:CvsContext)
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
            // 得到区间首个点（肯定是靠近线路起点的）在线路中的索引，使formalize算出正确的afterIdxEqv
            const firstPt = res.formalizePtIds.at(0)
            if(firstPt === undefined) return 
            const line = res.line
            const firstPtInLineIdx = line.pts.indexOf(firstPt)
            if(firstPtInLineIdx == -1) return
            const fpts = saveStore.getPtsByIds(res.formalizePtIds)
            const formalized = formalize(fpts, firstPtInLineIdx)
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
            ctx.beginPath()
            linkPts(ctx, formalized, line)
            const enforceLineWidth = line.isFilled ? 1 : undefined
            doRender(ctx, line, true, enforceLineWidth)
        })
        formalizedLineStore.setLocalFormalSegs(formalizedSegs)
        return {
            relatedPts,
            formalizedSegs
        }
    }
    function formalize(pts:ControlPoint[], idxOffset = 0):FormalPt[]{
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
        formalPts.push({pos:formalSegs[0].a, afterIdxEqv:0 + idxOffset })
        for(let i=0;i<formalSegs.length;i++){
            const seg = formalSegs[i]
            seg.itp.forEach(p=>formalPts.push({pos:p, afterIdxEqv: i + idxOffset }))
            formalPts.push({pos:seg.b, afterIdxEqv: i + 1 + idxOffset })
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
            return {a:a.pos, itp:[], b:b.pos, ill:0};
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
        let ill = 0;
        if(a.dir===b.dir){
            if(a.dir==ControlPointDir.incline){
                itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'midVert')
            }else{
                itp = coordFill(a.pos, b.pos, xDiff, yDiff, pr, rv, 'midInc')
            }
            
            if(itp.length==0){
                if(a.dir==ControlPointDir.vertical && (pr=='lu'||pr=='ur')
                    ||a.dir==ControlPointDir.incline && (pr=='l'||pr=='u'))
                {
                    ill = 2     //×-×
                }else{
                    ill = 0     //+-+
                }
            }else{
                ill = 1
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
                //如果是中间段，让前后两段矫正它
                const prevSeg = segs[i-1]
                const nextSeg = segs[i+1]
                const prevHelps = prevSeg.ill < thisSeg.ill
                const nextHelps = nextSeg.ill < thisSeg.ill
                if(prevHelps && nextHelps){
                    const prevRef = prevSeg.itp.length==0 ? prevSeg.a : prevSeg.itp[prevSeg.itp.length-1]
                    const prevRay = twinPts2Ray(prevRef, prevSeg.b)
                    const nextRef = nextSeg.itp.length==0 ? nextSeg.b : nextSeg.itp[0]
                    const nextRay = twinPts2Ray(nextRef, nextSeg.a)
                    const itsc = rayIntersect(prevRay, nextRay, true)
                    if(itsc)
                        thisSeg.itp = [itsc]
                }
            }
            else{
                //如果是末端，让最近的一段矫正它
                const func = (neibRef:Coord, share:Coord, thisRef:Coord|null, thisTip:Coord)=>{
                    const neibRay = twinPts2Ray(neibRef, share)
                    let thisRay:FormalRay;
                    if(!thisRef){
                        //若区间内只有尖端一个点
                        if(rayToCoordDist(neibRay, thisTip) < numberCmpEpsilon){
                            //若尖端本就在邻近区间延长线的垂线上，什么都不做
                            return
                        }
                        //尖端到邻近区间延长线的垂线，返回垂线交点
                        thisRay = {source:thisTip, way:[...neibRay.way]}
                        rayRotate90(thisRay)
                        return rayIntersect(neibRay, thisRay, true)
                    }else{
                        //若本区间有尖端外其他点，且尖端到该点延长线与邻近区间延长线垂直，返回交点
                        thisRay = twinPts2Ray(thisRef, share)
                        thisRay.source = thisTip
                        if(rayPerpendicular(neibRay, thisRay)){
                            return rayIntersect(neibRay, thisRay, true)
                        }
                    }
                }
                let itsc:Coord|undefined
                if(i==segs.length-1){
                    const prevSeg = segs[i-1]
                    const canHelp = prevSeg.ill<=thisSeg.ill && prevSeg.ill < 2
                    const needHelp = thisSeg.ill>0
                    if(needHelp && canHelp){
                        const neibRef = prevSeg.itp.length==0 ? prevSeg.a : prevSeg.itp[prevSeg.itp.length-1]
                        const share = thisSeg.a
                        const thisRef = thisSeg.itp.length>1 ? thisSeg.itp[0] : null
                        const thisTip = thisSeg.b
                        itsc = func(neibRef, share, thisRef, thisTip)
                    }
                }else if(i==0){
                    const nextSeg = segs[i+1]
                    const canHelp = nextSeg.ill<=thisSeg.ill && nextSeg.ill < 2
                    const needHelp = thisSeg.ill>0
                    if(canHelp && needHelp){
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
    function linkPts(ctx:CvsContext, formalPts:FormalPt[], lineInfo:Line){
        if(formalPts.length<=1){
            return;
        }
        const isRingLine = isRingByFormalPts(formalPts)
        const pts = formalPts.map(x=>x.pos)
        const first = pts[0]
        const second = pts[1]
        if(!isRingLine){
            ctx.moveTo(...first)
            let prevPt:Coord = first
            let prevToNowRay:FormalRay = twinPts2Ray(first, second)
            let prevDist:number = coordDist(first, second);
            for(let i=1;i<pts.length;i++){
                const nowPt = pts[i]
                if(i==pts.length-1){
                    ctx.lineTo(...nowPt)
                    break;
                }
                const nextPt = pts[i+1]
                const nextDist = coordDist(nowPt, nextPt)
                const nowToNextRay = twinPts2Ray(nowPt, nextPt)
                const rel = rayRel(prevToNowRay, nowToNextRay)
                const turnRadius = cs.getTurnRadiusOf(lineInfo, rel)
                const taRadius = Math.min(turnRadius, prevDist/2, nextDist/2)
                const prevBias = twinPts2SgnCoord(nowPt, prevPt)
                const prevSok = applyBias(nowPt, prevBias, taRadius)
                const nextBias = twinPts2SgnCoord(nowPt, nextPt) 
                const nextSok = applyBias(nowPt, nextBias, taRadius)
                ctx.lineTo(...prevSok)
                drawArcByThreePoints(ctx, prevSok, nowPt, nextSok)
                prevDist = nextDist;
                prevToNowRay = nowToNextRay;
                prevPt = nowPt;
            }
        }else{
            const lastButOnePt = pts[pts.length-2]
            let prevPt:Coord = lastButOnePt
            let prevToNowRay:FormalRay = twinPts2Ray(lastButOnePt, first)
            let prevDist:number = coordDist(lastButOnePt, first);
            let ringHeadStartSok:Coord = [0,0]
            for(let i=0;i<pts.length;i++){
                const nowPt = pts[i]
                if(i===pts.length-1){
                    ctx.lineTo(...ringHeadStartSok)
                    break;
                }
                const nextPt = pts[i+1]
                const nextDist = coordDist(nowPt, nextPt)
                const nowToNextRay = twinPts2Ray(nowPt, nextPt)
                const rel = rayRel(prevToNowRay, nowToNextRay)
                const turnRadius = cs.getTurnRadiusOf(lineInfo, rel)
                const taRadius = Math.min(turnRadius, prevDist/2, nextDist/2)
                const prevBias = twinPts2SgnCoord(nowPt, prevPt)
                const prevSok = applyBias(nowPt, prevBias, taRadius)
                const nextBias = twinPts2SgnCoord(nowPt, nextPt) 
                const nextSok = applyBias(nowPt, nextBias, taRadius)
                if(i===0){
                    ctx.moveTo(...prevSok)
                    ringHeadStartSok = prevSok
                }
                else
                    ctx.lineTo(...prevSok)
                drawArcByThreePoints(ctx, prevSok, nowPt, nextSok)
                prevDist = nextDist;
                prevToNowRay = nowToNextRay;
                prevPt = nowPt;
            }
        }
    }
    function doRender(ctx:CvsContext, lineInfo:Line, enforceNoFill?:boolean, enforceLineWidth?:number, type?:LineRenderType){
        const drawCarpet =( !type || type==='both' || type==='carpet')&& (!lineInfo.removeCarpet)
        const drawBody = !type || type==='both' || type==='body'
        if(!lineInfo.isFilled || enforceNoFill || lineInfo.type!==LineType.terrain){
            const lineWidth = cs.config.lineWidth * (enforceLineWidth||lineInfo.width||1)
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            if(drawCarpet){
                const carpetWiden = cs.config.lineCarpetWiden
                ctx.lineWidth = lineWidth+carpetWiden
                ctx.strokeStyle = cs.config.bgColor
                ctx.stroke()
            }
            if(drawBody){
                const lineColor = lineStateStore.getLineActualColor(lineInfo)
                const lineDownplayed = lineStateStore.isLineDownplayed(lineInfo.id)
                const itsStyle = saveStore.save?.lineStyles?.find(x=>x.id===lineInfo.style)
                if(itsStyle){
                    const scale = ctx.getCurrentScale()
                    const offset = ctx.getCurrentOffset()
                    strokeStyledLine(ctx, {
                        scale,
                        offset,
                        lineStyle: itsStyle,
                        lineWidthBase: lineWidth,
                        dynaColor: lineColor,
                        fixedColorConverter: (c)=>{
                            if(lineDownplayed)
                                return colorProc.colorProcDownplay.convert(c)
                            return c
                        }
                    })
                }else{
                    ctx.lineWidth = lineWidth
                    ctx.strokeStyle = lineColor
                    ctx.stroke()
                }
            }
        }else{
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            if(drawCarpet){
                const carpetWiden = cs.config.lineWidth * 0.5
                ctx.lineWidth = carpetWiden
                ctx.strokeStyle = cs.config.bgColor
                ctx.stroke()
            }
            if(drawBody){
                ctx.fillStyle = lineStateStore.getLineActualColor(lineInfo)
                ctx.fill()
            }
        }
    }
    return { renderAllLines, renderLine, renderSegsAroundActivePt }
})