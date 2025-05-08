import { ControlPoint } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { useStaNameRectStore } from "@/models/stores/saveDerived/staNameRectStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { coordAdd, coordTwinShrink } from "@/utils/coordUtils/coordMath";
import { drawText } from "@/utils/drawUtils/drawText";
import { sgnCoord } from "@/utils/sgn";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useCvsBlocksControlStore } from "../common/cvs";
import { Coord } from "@/models/coord";
import { useStaClusterStore } from "@/models/stores/saveDerived/staClusterStore";

export const useStaNameCvsWorker = defineStore('staNameCvsWorker', ()=>{
    const saveStore = useSaveStore()
    const staNameRectStore = useStaNameRectStore()
    const cvsBlocksControlStore = useCvsBlocksControlStore()
    const staClusterStore = useStaClusterStore()
    const cs = useConfigStore()
    function renderAllPtName(ctx:CvsContext, needReportRectPts?:number[], noOmit?:boolean){
        if(!saveStore.save)
            return;
        const pts = saveStore.save.points;
        pts.forEach(pt=>{
            const needReportRect = !needReportRectPts || needReportRectPts.includes(pt.id)
            renderPtName(ctx, pt, needReportRect, undefined, noOmit)
        })
    }
    function renderPtNameById(ctx:CvsContext, ptId:number, needReportRect?:boolean, markRoot?:'free'|'snapVague'|'snapAccu'){
        const pt = saveStore.getPtById(ptId);
        if(pt)
            return renderPtName(ctx, pt, needReportRect, markRoot)
    }
    function renderPtName(ctx:CvsContext, pt:ControlPoint, needReportRect?:boolean, markRoot?:'free'|'snapVague'|'snapAccu', noOmit = false){
        if(!pt.nameP)
            return;
        const globalPos = coordAdd(pt.pos, pt.nameP)
        if((!noOmit && checkOmittable(globalPos)))
            return
        const align = sgnCoord(pt.nameP)
        //优先使用pt内设置的值，若pt内的值为undefined或0，再去找cluster内最大的
        const fontSizeRatio = Number(pt.nameSize) || staClusterStore.getMaxSizePtWithinCluster(pt.id, 'ptNameSize')
        const ptSizeRatio = staClusterStore.getMaxSizePtWithinCluster(pt.id, 'ptSize')
        const ptRadius = ptSizeRatio * cs.config.ptStaSize

        const dist = Math.sqrt(pt.nameP[0] ** 2 + pt.nameP[1] ** 2)
        if(dist > ptRadius*3){
            ctx.beginPath()
            ctx.lineWidth = 2*fontSizeRatio
            ctx.strokeStyle = "#999"
            const nodeDistToCenter = ptRadius * 1.6
            const linkStart = coordTwinShrink(globalPos, pt.pos, nodeDistToCenter)
            ctx.moveTo(linkStart[0], linkStart[1])
            ctx.lineTo(...globalPos)
            ctx.stroke()
        }

        const rect = drawText(ctx, globalPos, align, undefined, {
            text: pt.name,
            color: cs.config.staNameColor,
            font: cs.config.staNameFont,
            fontSize: cs.config.staNameFontSize * fontSizeRatio,
            rowHeight: cs.config.staNameRowHeight * fontSizeRatio
        },{
            text: pt.nameS,
            color: cs.config.staNameSubColor,
            font: cs.config.staNameSubFont,
            fontSize: cs.config.staNameSubFontSize * fontSizeRatio,
            rowHeight: cs.config.staNameSubRowHeight * fontSizeRatio
        },
        {
            width: cs.config.staNameFontSize * fontSizeRatio/4,
            color: cs.config.bgColor,
            opacity: 0.8
        }, needReportRect ? 'both' : 'draw')

        if(rect){
            staNameRectStore.setStaNameRects(pt.id, rect)
        }

        if(markRoot){
            ctx.beginPath()
            ctx.fillStyle = 'white'
            const rootBgRadius = 6 * fontSizeRatio
            ctx.arc(...globalPos, rootBgRadius, 0, 2*Math.PI)
            ctx.fill()
            ctx.beginPath()
            if(markRoot == 'snapAccu')
                ctx.fillStyle = 'green'
            else if(markRoot == 'snapVague')
                ctx.fillStyle = 'orange'
            else
                ctx.fillStyle = 'red'
            const rootRadius = 4 * fontSizeRatio
            ctx.arc(...globalPos, rootRadius, 0, 2*Math.PI)
            ctx.fill()
        }
    }
    function checkOmittable(globalPos:Coord){
        const { cvsWidth, cvsHeight } = saveStore
        const rect = [[...globalPos],[...globalPos]]
        rect[0][0] -= 200
        rect[1][0] += 200
        rect[0][1] -= 75
        rect[1][1] += 75
        const { left, right, top, bottom } = cvsBlocksControlStore.blockTotalBoundary
        if(rect[1][0]/cvsWidth < left)
            return true
        if(rect[0][0]/cvsWidth > right)
            return true
        if(rect[1][1]/cvsHeight < top)
            return true
        if(rect[0][1]/cvsHeight > bottom)
            return true
        return false
    }
    return { renderAllPtName, renderPtName, renderPtNameById }
})