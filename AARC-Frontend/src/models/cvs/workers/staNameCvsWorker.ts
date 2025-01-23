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

export const useStaNameCvsWorker = defineStore('staNameCvsWorker', ()=>{
    const saveStore = useSaveStore()
    const staNameRectStore = useStaNameRectStore()
    const cvsBlocksControlStore = useCvsBlocksControlStore()
    const cs = useConfigStore()
    function renderAllPtName(ctx:CvsContext, needReportRectPts?:number[]){
        if(!saveStore.save)
            return;
        const pts = saveStore.save.points;
        pts.forEach(pt=>{
            const needReportRect = !needReportRectPts || needReportRectPts.includes(pt.id)
            renderPtName(ctx, pt, needReportRect)
        })
    }
    function renderPtNameById(ctx:CvsContext, ptId:number, needReportRect?:boolean, markRoot?:'free'|'snapVague'|'snapAccu'){
        const pt = saveStore.getPtById(ptId);
        if(pt)
            return renderPtName(ctx, pt, needReportRect, markRoot)
    }
    function renderPtName(ctx:CvsContext, pt:ControlPoint, needReportRect?:boolean, markRoot?:'free'|'snapVague'|'snapAccu'){
        if(!pt.nameP || checkOmittable(pt.id))
            return;
        const globalPos = coordAdd(pt.pos, pt.nameP)
        const align = sgnCoord(pt.nameP)

        const distSq = pt.nameP[0] ** 2 + pt.nameP[1] ** 2
        if(distSq > 1200){
            ctx.beginPath()
            ctx.lineWidth = 2
            ctx.strokeStyle = "#999"
            const linkStart = coordTwinShrink(globalPos, pt.pos, 18)
            ctx.moveTo(linkStart[0], linkStart[1])
            ctx.lineTo(...globalPos)
            ctx.stroke()
        }

        const rect = drawText(ctx, globalPos, align, undefined, {
            text: pt.name,
            color: cs.config.staNameColor,
            font: cs.config.staNameFont,
            fontSize: cs.config.staNameFontSize,
            rowHeight: cs.config.staNameRowHeight
        },{
            text: pt.nameS,
            color: cs.config.staNameSubColor,
            font: cs.config.staNameSubFont,
            fontSize: cs.config.staNameSubFontSize,
            rowHeight: cs.config.staNameSubRowHeight
        },
        {
            width: cs.config.staNameFontSize/4,
            color: cs.config.bgColor,
            opacity: 0.8
        }, needReportRect ? 'both' : 'draw')

        if(rect){
            staNameRectStore.setStaNameRects(pt.id, rect)
        }

        if(markRoot){
            ctx.beginPath()
            if(markRoot == 'snapAccu')
                ctx.fillStyle = 'green'
            else if(markRoot == 'snapVague')
                ctx.fillStyle = 'orange'
            else
                ctx.fillStyle = 'red'
            ctx.arc(...globalPos, 4, 0, 2*Math.PI)
            ctx.fill()
        }
    }
    function checkOmittable(id:number){
        const rect = staNameRectStore.getStaNameRect(id)
        if(!rect)
            return false
        const { cvsWidth, cvsHeight } = saveStore
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