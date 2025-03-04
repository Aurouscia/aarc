import { useSaveStore } from "../../stores/saveStore";
import { ControlPoint, ControlPointDir, ControlPointSta, Line } from "../../save";
import { useConfigStore } from "@/models/stores/configStore";
import { drawCross } from "@/utils/drawUtils/drawCross";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { Coord } from "@/models/coord";
import { useCvsBlocksControlStore } from "../common/cvs";
import { useSnapStore } from "@/models/stores/snapStore";

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
            if(relatedLines.length==1 && !active){
                ctx.strokeStyle = saveStore.getLineActualColor(relatedLines[0])
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