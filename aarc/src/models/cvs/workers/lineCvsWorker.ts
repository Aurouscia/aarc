/**
 * SVG 导出兼容说明：
 * 
 * 本文件内有多个 `buildPath` 变量，仅在 svgcanvas（SVG 导出）模式下创建和使用。
 * 
 * 背景：svgcanvas 的 stroke() 不会创建新的 <path> 元素，而是修改当前元素的样式。
 * 当线路有多层样式（multi-layer line style）时，strokeStyledLine 会对同一条路径
 * 调用多次 stroke()，导致后一层覆盖前一层的样式，最终 SVG 只显示最后一层。
 * 
 * 解决方案：在 strokeStyledLine 中，每次 stroke() 前调用 pathBuilder 回调，
 * 重新 beginPath() 并重建路径，确保每层样式都有自己的独立 <path> 元素。
 * 
 * 性能考虑：buildPath 仅在检测到 svgcanvas 上下文时才创建；正常 Canvas 渲染时
 * 为 undefined，完全保持原有行为，不增加任何开销。
 * 
 * 涉及位置：
 * - 简化模式（ignoreStyleAndSpan）
 * - Carpet 渲染
 * - renderAllSpansBase（逐 span）
 * - renderAllSpansStyle（按组聚合）
 * - 旧版 doRender（选中点局部）
 */

import { useSaveStore } from "../../stores/saveStore";
import { ControlPoint, Line, LineType } from "../../save";
import { applyBias } from "@/utils/coordUtils/coordBias";
import { Coord, FormalPt, FormalRay, twinPts2Ray, twinPts2SgnCoord } from "../../coord";
import { coordDist } from "@/utils/coordUtils/coordDist";
import { useEnvStore } from "@/models/stores/envStore";
import { useConfigStore } from "@/models/stores/configStore";
import { FormalizedLine, SpanRenderInfo, useFormalizedLineStore } from "@/models/stores/saveDerived/formalizedLineStore";
import { rayRel, WayRel } from "@/utils/rayUtils/rayParallel";
import { defineStore } from "pinia";
import { ptInLineIndices } from "@/utils/lineUtils/ptInLineIndices";
import { getByIndexInRing, isRing, isRingByFormalPts } from "@/utils/lineUtils/isRing";
import { drawArcByThreePoints } from "@/utils/drawUtils/drawArc";
import { CvsContext } from "../common/cvsContext";
import { LineStrokeTarget, strokeStyledLine } from "../common/strokeStyledLine";
import { useLineStateStore } from "@/models/stores/saveDerived/state/lineStateStore";
import { useColorProcStore } from "@/models/stores/utils/colorProcStore";
import { LineStyle } from "@/models/save";
import { useEditorLocalConfigStore } from "@/app/localConfig/editorLocalConfig";
import { useCvsFrameStore } from "@/models/stores/cvsFrameStore";
import { useRenderOptionsStore } from "@/models/stores/renderOptionsStore";
import { formalize } from "@/utils/lineUtils/formalize";

type LineRenderType = 'both'|'body'|'carpet'

type GetTurnRadiusOf = (lineInfo: Line, rel: WayRel) => number

/**
 * 将一组 formalized 线路点连接成 canvas 路径。
 *
 * 核心思路：
 * - 相邻两段直线的转角处，用圆角（arc）代替尖角；
 * - 直线部分只画到“切点”（sok），圆角部分用切点-顶点-切点三点画弧；
 * - 环线与非环线的“处理单个转角”逻辑完全相同，区别仅在于：
 *   1. 起始/结束位置不同；
 *   2. 环线首点的前一段是“倒数第二点 → 首点”。
 *   因此把公共转角处理提取到同一个循环中。
 *
 * 注意：当前统一使用 drawArcByThreePoints 的默认 'formal' 模式，
 *      自由点（free）的任意角度圆角集成需在此显式传入 mode: 'free'。
 */
export function linkPts(
    ctx:CvsContext,
    formalPts:FormalPt[],
    lineInfo:Line,
    getTurnRadiusOf:GetTurnRadiusOf,
    simplify?: boolean
){
    // 点数不足时无法形成线段，直接返回
    if(formalPts.length<=1){
        return;
    }
    // 判断是否为环线：首末 formal 点坐标重合
    const isRingLine = isRingByFormalPts(formalPts)
    // 提取所有 formal 点的实际坐标，后续几何计算只依赖位置
    const pts = formalPts.map(x=>x.pos)

    // 视图足够远时直接连线，不再绘制圆角
    if(simplify){
        ctx.moveTo(...pts[0])
        for(let i=1;i<pts.length;i++){
            ctx.lineTo(...pts[i])
        }
        if(isRingLine){
            ctx.lineTo(...pts[0])
        }
        return
    }

    // 确定需要处理“转角”的索引范围，以及获取每个转角前一点索引的规则
    let cornerStartIdx:number
    let cornerEndIdx:number          // 包含该索引
    let getPrevIdx:(i:number)=>number
    if(!isRingLine){
        // 非环线：转角在 pts[1] .. pts[n-2]，前一点就是 i-1
        cornerStartIdx = 1
        cornerEndIdx = pts.length - 2
        getPrevIdx = i => i - 1
        // 路径从第一个点开始
        ctx.moveTo(...pts[0])
    }else{
        // 环线：转角在 pts[0] .. pts[n-2]（pts[n-1] 与 pts[0] 重合）
        // 首点的前一段是“倒数第二点 → 首点”
        cornerStartIdx = 0
        cornerEndIdx = pts.length - 2
        getPrevIdx = i => i === 0 ? pts.length - 2 : i - 1
    }

    // 初始化“进入”第一个转角的前一段状态
    const initialPrevIdx = getPrevIdx(cornerStartIdx)
    let prevPt:Coord = pts[initialPrevIdx]
    let prevToNowRay:FormalRay = twinPts2Ray(prevPt, pts[cornerStartIdx])
    let prevDist:number = coordDist(prevPt, pts[cornerStartIdx])
    // 环线专用：保存头部切点，最后 lineTo 回到该点以闭合路径
    let ringHeadStartSok:Coord | undefined

    for(let i=cornerStartIdx;i<=cornerEndIdx;i++){
        const nowPt = pts[i]
        const nextPt = pts[i+1]

        // 下一段直线的长度
        const nextDist = coordDist(nowPt, nextPt)
        // 从当前点指向下一个点的 8 方向射线
        const nowToNextRay = twinPts2Ray(nowPt, nextPt)

        // 两段射线的方向关系：parallel / 90 / 45 / 135
        const rel = rayRel(prevToNowRay, nowToNextRay)
        // 根据线路配置和转角关系获取理论圆角半径
        const turnRadius = getTurnRadiusOf(lineInfo, rel)
        // 实际圆角半径不能超过前后线段长度的一半，防止弧越界
        const taRadius = Math.min(turnRadius, prevDist/2, nextDist/2)

        // prevBias: 从当前点指向前一个点的 8 方向单位向量（SgnCoord）
        const prevBias = twinPts2SgnCoord(nowPt, prevPt)
        // prevSok: 沿 prevBias 方向从当前点回退 taRadius 得到的切点
        const prevSok = applyBias(nowPt, prevBias, taRadius)
        // nextBias: 从当前点指向下一个点的 8 方向单位向量
        const nextBias = twinPts2SgnCoord(nowPt, nextPt)
        // nextSok: 沿 nextBias 方向从当前点前进 taRadius 得到的切点
        const nextSok = applyBias(nowPt, nextBias, taRadius)

        if(isRingLine && i === cornerStartIdx){
            // 环线首点：从头部切点开始路径，并保存该切点用于最后闭合
            ctx.moveTo(...prevSok)
            ringHeadStartSok = prevSok
        }else{
            // 先画到前一段的切点
            ctx.lineTo(...prevSok)
        }
        // 用 prevSok（弧起点）、nowPt（弧经过点）、nextSok（弧终点）画圆角
        drawArcByThreePoints(ctx, prevSok, nowPt, nextSok)

        // 为下一次迭代更新状态
        prevDist = nextDist;
        prevToNowRay = nowToNextRay;
        prevPt = nowPt;
    }

    // 路径收尾
    if(!isRingLine){
        // 非环线：从最后一个转角切点画直线到最后一个点
        ctx.lineTo(...pts[pts.length-1])
    }else if(ringHeadStartSok){
        // 环线：从最后一个转角切点画直线回到头部切点，平滑闭合
        ctx.lineTo(...ringHeadStartSok)
    }
}

export const useLineCvsWorker = defineStore('lineCvsWorker', ()=>{
    const saveStore = useSaveStore();
    const lineStateStore = useLineStateStore()

    const envStore = useEnvStore();
    const formalizedLineStore = useFormalizedLineStore()
    const cs = useConfigStore();
    const colorProc = useColorProcStore()
    const cvsFrameStore = useCvsFrameStore()
    const editorLocalConfigStore = useEditorLocalConfigStore()
    const renderOptionsStore = useRenderOptionsStore()

    const lineFobThrsBase = 0.000001

    function lineShouldSimplify(): boolean {
        if (renderOptionsStore.exporting) return false
        const viewRect = cvsFrameStore.getViewRectSideLengths()
        const viewRectArea = viewRect[0] * viewRect[1]
        if (!viewRectArea) return false
        const ratio = cs.config.lineTurnAreaRadius / viewRectArea
        const thrs = lineFobThrsBase * (Number(editorLocalConfigStore.lineFob) || 1)
        return ratio < thrs
    }
    function renderAllLines(ctx:CvsContext, ltype?:LineType, rtype?:LineRenderType){
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
            renderLine(ctx, toRender, rtype)
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
    function renderLine(ctx:CvsContext, line:Line|Line[], rtype?:LineRenderType){
        if(!(line instanceof Array)){
            line = [line]
        }
        if(line.length===0)
            return
        
        for(const l of line){
            const pts = saveStore.getPtsByIds(l.pts)
            if(pts.length<=1)
                return;
            const formalPts = formalize(pts)
            formalizedLineStore.setLinesFormalPts(l.id, formalPts)
        }

        const includeCarpet = !rtype || rtype == 'carpet' || rtype == 'both'

        // 简化模式：无视样式和分段，整线统一绘制
        if(editorLocalConfigStore.ignoreStyleAndSpan || lineShouldSimplify()){
            for(const l of line){
                const formalPts = formalizedLineStore.getLinesFormalPts(l.id) ?? []
                const buildPath = () => {
                    ctx.beginPath()
                    linkPts(ctx, formalPts, l, cs.getTurnRadiusOf, lineShouldSimplify())
                }
                buildPath()
                doRender(ctx, l, undefined, undefined, 'both', 'base', buildPath)
            }
            return
        }

        // 1. Carpet 保持整线绘制
        if(includeCarpet){
            for(const l of line){
                const formalPts = formalizedLineStore.getLinesFormalPts(l.id) ?? []
                const buildPath = () => {
                    ctx.beginPath()
                    linkPts(ctx, formalPts, l, cs.getTurnRadiusOf, lineShouldSimplify())
                }
                buildPath()
                doRender(ctx, l, undefined, undefined, 'carpet', undefined, buildPath)
            }
        }

        // 2. Body 按 span 拆分渲染
        // 收集所有 line（含 children）的所有 spans，然后统一先画 base 再画 style
        // 这样可以避免不同 line 之间的 base/style 覆盖问题（如支线分叉处）
        const includeBody = !rtype || rtype == 'body' || rtype == 'both'
        if(includeBody){
            const allSpanInfos: SpanRenderInfo[] = []
            for(const l of line){
                allSpanInfos.push(...formalizedLineStore.collectSpanRenderInfos(l))
            }
            renderAllSpansBase(ctx, allSpanInfos)
            renderAllSpansStyle(ctx, allSpanInfos)
        }
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
            const buildPath = () => {
                ctx.beginPath()
                linkPts(ctx, formalized, line, cs.getTurnRadiusOf, lineShouldSimplify())
            }
            buildPath()
            const enforceLineWidth = line.isFilled ? 1 : undefined
            doRender(ctx, line, true, enforceLineWidth, undefined, undefined, buildPath)
        })
        formalizedLineStore.setLocalFormalSegs(formalizedSegs)
        return {
            relatedPts,
            formalizedSegs
        }
    }
    interface SpanRenderOptions {
        color?: string
        downplayed?: boolean
        style?: LineStyle
        styleId?: number
        strokeTarget?: LineStrokeTarget
    }

    /**
     * 新版渲染函数（渲染单个 span，carpet 部分除外）
     */
    function doRenderSpan(
        ctx: CvsContext,
        lineInfo: Line,
        options: SpanRenderOptions & { pathBuilder?: () => void }
    ) {
        const { color, downplayed, style, styleId, strokeTarget, pathBuilder } = options
        const lineColor = color ?? lineStateStore.getLineActualColor(lineInfo)

        // 填充线路（如湖泊）
        if (lineInfo.isFilled && lineInfo.type === LineType.terrain) {
            ctx.fillStyle = lineColor
            ctx.fill()
            return
        }

        // 普通 stroke 线路
        const lineWidth = cs.config.lineWidth * (lineInfo.width || 1)
        ctx.lineJoin = 'round'

        const lineDownplayed = downplayed ?? lineStateStore.isLineDownplayed(lineInfo.id)
        const effectiveStyleId = styleId ?? lineInfo.style
        const itsStyle = style ?? saveStore.save?.lineStyles?.find(x => x.id === effectiveStyleId)

            const scale = ctx.getCurrentScale()
            const offset = ctx.getCurrentOffset()

            strokeStyledLine(ctx, {
                target: strokeTarget ?? 'both',
                scale,
                offset,
                lineStyle: itsStyle,
                lineWidthBase: lineWidth,
                baseCap: lineCapWithDefault(lineInfo),
                dynaColor: lineColor,
                fixedColorConverter: (c) => {
                    if (lineDownplayed)
                        return colorProc.colorProcDownplay.convert(c)
                    return c
                },
                pathBuilder
            })
    }



    /**
     * 统一绘制所有 span 的 base（新版渲染函数的包装器）
     */
    function renderAllSpansBase(ctx: CvsContext, infos: SpanRenderInfo[]) {
        for (const info of infos) {
            const buildPath = () => {
                ctx.beginPath()
                linkPts(ctx, info.formalPts, info.line, cs.getTurnRadiusOf, lineShouldSimplify())
            }
            buildPath()
            doRenderSpan(ctx, info.line, {
                color: info.color,
                downplayed: info.downplayed,
                style: info.style,
                styleId: info.styleId,
                strokeTarget: 'base',
                pathBuilder: buildPath
            })
        }
    }

    /**
     * 统一绘制所有 span 的 style（新版渲染函数的包装器）
     * 
     * 将样式相同的 span 聚集后批量渲染，减少 canvas 状态切换次数。
     * 
     * 分组依据：(styleId, line.width, color, downplayed)
     * 这四个参数决定了 strokeStyledLine 在 target='style' 时的全部视觉表现：
     * - styleId/style → lineStyle.layers 决定每层 lineWidth 倍率、opacity、strokeStyle、lineCap、dash、pattern
     * - line.width    → lineWidthBase，所有样式层宽度的计算基准
     * - color         → dynaColor，当 layer.colorMode === 'line' 时的线条颜色
     * - downplayed    → fixedColorConverter，当 layer.colorMode !== 'line' 时对固定颜色的淡化处理
     * 
     * 同组的 span 具有完全相同的 canvas 渲染状态，因此可以把它们的路径累积到同一条
     * path 中（linkPts 内部使用 moveTo 开始每个 span，不会互相干扰），然后只需
     * 调用一次 doRenderSpan → strokeStyledLine 即可完成该组所有 span 的样式渲染。
     * 
     * scale 和 offset 来自 ctx 本身，同一次渲染中对所有 span 相同，无需参与分组。
     */
    function renderAllSpansStyle(ctx: CvsContext, infos: SpanRenderInfo[]) {
        // 按 (styleId, line.width, color, downplayed) 分组
        const groups = new Map<string, SpanRenderInfo[]>()
        for (const info of infos) {
            const effectiveStyleId = info.styleId ?? info.line.style
            const itsStyle = info.style || saveStore.save?.lineStyles?.find(x => x.id === effectiveStyleId)
            if (!itsStyle) continue

            const lineWidth = info.line.width || 1
            const key = `${itsStyle.id}|${lineWidth}|${info.color ?? ''}|${info.downplayed}`
            const existing = groups.get(key)
            if (existing) {
                existing.push(info)
            } else {
                groups.set(key, [info])
            }
        }

        for (const groupInfos of groups.values()) {
            const representative = groupInfos[0]
            const buildPath = () => {
                ctx.beginPath()
                for (const info of groupInfos) {
                    linkPts(ctx, info.formalPts, info.line, cs.getTurnRadiusOf, lineShouldSimplify())
                }
            }
            buildPath()
            doRenderSpan(ctx, representative.line, {
                color: representative.color,
                downplayed: representative.downplayed,
                style: representative.style,
                styleId: representative.styleId,
                strokeTarget: 'style',
                pathBuilder: buildPath
            })
        }
    }

    /** 
     * 旧版渲染函数（整条线，目前仅用于 carpet 和选中点局部）
     */
    function doRender(
        ctx:CvsContext, lineInfo:Line, enforceNoFill?:boolean,
        enforceLineWidth?:number, type?:LineRenderType, strokeTarget?:LineStrokeTarget,
        pathBuilder?:()=>void
    ){
        const drawCarpet = (!type || type==='both' || type==='carpet') && (!lineInfo.removeCarpet)
        const drawBody = !type || type==='both' || type==='body'
        if(!lineInfo.isFilled || enforceNoFill || lineInfo.type!==LineType.terrain){
            const lineWidth = cs.config.lineWidth * (enforceLineWidth||lineInfo.width||1)
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            if(drawCarpet){
                if(pathBuilder) pathBuilder()
                const carpetWiden = cs.config.lineCarpetWiden
                ctx.lineWidth = lineWidth+carpetWiden
                ctx.strokeStyle = cs.config.bgColor
                ctx.stroke()
            }
            if(drawBody){
                const lineColor = lineStateStore.getLineActualColor(lineInfo)
                const lineDownplayed = lineStateStore.isLineDownplayed(lineInfo.id)
                let styleId = lineInfo.style
                if(styleId == -1 && lineInfo.parent){
                    // -1 表示跟随主线路的样式
                    styleId = saveStore.getLineById(lineInfo.parent)?.style
                }
                const itsStyle = saveStore.save?.lineStyles?.find(x=>x.id===styleId)
                if(itsStyle){
                    const scale = ctx.getCurrentScale()
                    const offset = ctx.getCurrentOffset()
                    strokeStyledLine(ctx, {
                        target: strokeTarget,
                        scale,
                        offset,
                        lineStyle: itsStyle,
                        lineWidthBase: lineWidth,
                        baseCap: lineCapWithDefault(lineInfo),
                        dynaColor: lineColor,
                        fixedColorConverter: (c)=>{
                            if(lineDownplayed)
                                return colorProc.colorProcDownplay.convert(c)
                            return c
                        },
                        pathBuilder
                    })
                }else{
                    if(pathBuilder) pathBuilder()
                    ctx.lineWidth = lineWidth
                    ctx.strokeStyle = lineColor
                    ctx.stroke()
                }
            }
        }else{
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            if(drawCarpet){
                if(pathBuilder) pathBuilder()
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

    function lineCapWithDefault(lineInfo: Line){
        return lineInfo.cap || (lineInfo.type == LineType.common ? 'butt' : 'round') // 线路默认用方头，地形默认用圆头
    }

    return { renderAllLines, renderLine, renderSegsAroundActivePt }
})