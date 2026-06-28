import { useSaveStore } from "../../stores/saveStore";
import { ControlPoint, ControlPointDir, ControlPointSta, Line } from "../../save";
import { useConfigStore } from "@/models/stores/configStore";
import { drawCross } from "@/utils/drawUtils/drawCross";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { Coord } from "@/models/coord";
import { useCvsBlocksControlStore } from "../common/cvs";
import { useSnapStore } from "@/models/stores/snapStore";
import { isLineFamily } from "@/utils/lineUtils/isLineFamily";
import { ptInLineIndices } from "@/utils/lineUtils/ptInLineIndices";
import { useLineStateStore } from "@/models/stores/saveDerived/state/lineStateStore";
import { useLineSpanStore } from "@/models/stores/saveDerived/slice/lineSpanStore";

/**
 * 根据站点所在线路的 span 淡化状态，计算车站圆圈应使用的描边颜色。
 *
 * 策略：站点所有相邻 span 都淡化时，站点才使用淡化色；
 * 否则使用未淡化 span 的实际颜色（通常为线路基础色）。
 *
 * 相邻 span 的判定：
 * - 站点索引严格位于某 span 内部（fromIdx < idx < toIdx）→ 该 span 为唯一相邻 span
 * - 站点索引位于 span 边界（idx === fromIdx 或 idx === toIdx）→ 前后两个 span 均为相邻 span
 * - 线路端点 → 只有一个相邻 span
 *
 * @param line - 站点所属的线路（同线路族时应取主线/父线）
 * @param ptId - 站点控制点 ID
 * @returns 实际描边颜色；若站点不在该线路上则返回 undefined
 */
export function getStaColorFromSpan(line: Line, ptId: number): string | undefined {
    const lineSpanStore = useLineSpanStore()
    const lineStateStore = useLineStateStore()
    const flattened = lineSpanStore.getFlattenedLine(line.id)
    if (!flattened || flattened.spans.length === 0) {
        return lineStateStore.getLineActualColor(line)
    }

    const indices = ptInLineIndices(ptId, line)
    if (indices.length === 0) return undefined
    const idx = indices[0]

    const adjacentSpanIdxs: number[] = []
    flattened.spans.forEach((span, spanIdx) => {
        if (idx > span.fromIdx && idx < span.toIdx) {
            adjacentSpanIdxs.push(spanIdx)
        } else if (idx === span.fromIdx || idx === span.toIdx) {
            adjacentSpanIdxs.push(spanIdx)
        }
    })

    if (adjacentSpanIdxs.length === 0) {
        return lineStateStore.getLineActualColor(line)
    }

    // 策略：所有相邻 span 都淡化，站点才淡化
    const anyNotDownplayed = adjacentSpanIdxs.some(
        spanIdx => !lineStateStore.isSpanDownplayed(line.id, spanIdx)
    )

    if (anyNotDownplayed) {
        const notDownplayedSpanIdx = adjacentSpanIdxs.find(
            spanIdx => !lineStateStore.isSpanDownplayed(line.id, spanIdx)
        )!
        return lineStateStore.getSpanActualColor(line.id, notDownplayedSpanIdx)
    }

    return lineStateStore.getSpanActualColor(line.id, adjacentSpanIdxs[0])
}

export const usePointCvsWorker = defineStore('pointCvsWorker', ()=>{
    const saveStore = useSaveStore();
    const cvsBlocksControlStore = useCvsBlocksControlStore()
    const cs = useConfigStore();
    const snapStore = useSnapStore()
    function renderAllPoints(ctx:CvsContext, onlyVisiblePts?:boolean, noOmit?:boolean){
        if(!saveStore.save)
            return
        const allPts = saveStore.save.points
        for(const pt of allPts){
            renderPoint(ctx, pt, {active:false, staOnly:onlyVisiblePts, noOmit})
        }
    }
    function renderLinePoints(ctx:CvsContext, line:Line){
        const ptIds = line.pts
        if(ptIds && ptIds.length>0){
            const pts = saveStore.save?.points.filter(p=>ptIds.includes(p.id))
            pts?.forEach(p=>renderPoint(ctx, p, {}))
        }
    }
    function renderSomePoints(ctx:CvsContext, pts:Iterable<ControlPoint>, activeId:number){
        for(const pt of pts){
            renderPoint(ctx, pt, {active: activeId == pt.id})
        }
    }
    function renderPointById(ctx:CvsContext, ptId:number, active:boolean = false){
        const pt = saveStore.getPtById(ptId)
        if(pt)
            renderPoint(ctx, pt, {active})
    }
    function renderPoint(ctx:CvsContext, pt:ControlPoint, options:PointRenderOptions){
        const pos = pt.pos;
        const { active, staOnly, noOmit } = options
        if(!noOmit && checkOmittable(pos))
            return
        let markColor = '#999'
        const relatedLines = saveStore.getLinesByPt(pt.id)
        if(relatedLines.length>0 && relatedLines.every(x=>saveStore.isLineTypeWithoutSta(x.type)))
            pt.sta = ControlPointSta.plain //自动设置车站类型
        let staType = pt.sta
        if(staType !== ControlPointSta.sta && staOnly)
            return
        const sizeRatio = saveStore.getLinesDecidedPtSize(pt.id)
        if(staType === ControlPointSta.plain || active){
            const dir = pt.dir === ControlPointDir.incline ? 'incline':'vertical'
            let markSize = cs.config.ptBareSize * sizeRatio;
            let markWidth = cs.config.ptBareLineWidth * sizeRatio;
            if(active){
                markSize *= 2.2
                markWidth *= 1.6
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
            const arcRadius = cs.config.ptStaSize * sizeRatio
            const lineWidth = cs.config.ptStaLineWidth * sizeRatio
            if(relatedLines.length>0 && isLineFamily(relatedLines) && !active){
                const primaryLine = relatedLines.find(l => !l.parent) ?? relatedLines[0]
                ctx.strokeStyle = getStaColorFromSpan(primaryLine, pt.id) ?? markColor
            }else{
                ctx.strokeStyle = markColor
                ctx.beginPath()
                ctx.fillStyle = cs.config.bgColor
                ctx.arc(pos[0], pos[1], arcRadius + lineWidth, 0, 2*Math.PI)
                ctx.fill()
            }
            ctx.beginPath()
            ctx.lineWidth = lineWidth
            ctx.fillStyle = cs.config.ptStaFillColor
            ctx.arc(pos[0], pos[1], arcRadius, 0, 2*Math.PI)
            ctx.fill()
            ctx.stroke()
        }
    }
    function renderInterPtSnapTargets(ctx:CvsContext){
        const targets = snapStore.snapInterPtTargets
        for(const pt of targets?.snapToPts || []){
            renderPoint(ctx, pt, {})
        }
        for(const t of targets?.snapPoss || []){
            ctx.beginPath()
            ctx.arc(...t, 6, 0, 2*Math.PI)
            ctx.fillStyle = 'white'
            ctx.fill()
            ctx.beginPath()
            ctx.arc(...t, 4, 0, 2*Math.PI)
            ctx.fillStyle = '#008080'
            ctx.fill()
        }
        if(targets?.matched){
            ctx.beginPath()
            ctx.arc(...targets.matched, 6, 0, 2*Math.PI)
            ctx.fillStyle = 'white'
            ctx.fill()
            ctx.beginPath()
            ctx.arc(...targets.matched, 4, 0, 2*Math.PI)
            ctx.fillStyle = '#f00080'
            ctx.fill()
        }
    }
    function checkOmittable(pos:Coord){
        const radius = cs.config.ptStaSize * 3
        const { cvsWidth, cvsHeight } = saveStore
        const { left, right, top, bottom } = cvsBlocksControlStore.blockTotalBoundary
        if((pos[0] + radius)/cvsWidth < left)
            return true
        if((pos[0] - radius)/cvsWidth > right)
            return true
        if((pos[1] + radius)/cvsHeight < top)
            return true
        if((pos[1] - radius)/cvsHeight > bottom)
            return true
        return false
    }
    return { renderAllPoints, renderLinePoints, renderSomePoints, renderPoint, renderPointById, renderInterPtSnapTargets }
})

export interface PointRenderOptions{
    active?:boolean
    staOnly?:boolean
    noOmit?:boolean
}