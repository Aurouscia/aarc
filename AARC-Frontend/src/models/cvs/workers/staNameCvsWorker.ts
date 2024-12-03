import { Coord, RectCoord } from "@/models/coord";
import { ControlPoint } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { useStaNameRectStore } from "@/models/stores/saveDerived/staNameRectStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { coordTwinShrink } from "@/utils/coordUtils/coordMath";
import { sgn } from "@/utils/sgn";
import { defineStore } from "pinia";

export const useStaNameCvsWorker = defineStore('staNameCvsWorker', ()=>{
    const saveStore = useSaveStore()
    const staNameRectStore = useStaNameRectStore()
    const cs = useConfigStore()
    function renderAllPtName(ctx:CanvasRenderingContext2D, needReportRectPts?:number[]){
        if(!saveStore.save)
            return;
        const pts = saveStore.save.points;
        pts.forEach(pt=>{
            const needReportRect = !needReportRectPts || needReportRectPts.includes(pt.id)
            renderPtName(ctx, pt, needReportRect)
        })
    }
    function renderPtNameById(ctx:CanvasRenderingContext2D, ptId:number, needReportRect?:boolean, markRoot?:'free'|'snapVague'|'snapAccu'){
        const pt = saveStore.getPtById(ptId);
        if(pt)
            return renderPtName(ctx, pt, needReportRect, markRoot)
    }
    function renderPtName(ctx:CanvasRenderingContext2D, pt:ControlPoint, needReportRect?:boolean, markRoot?:'free'|'snapVague'|'snapAccu'){
        if(!pt.nameP)
            return;
        const x = pt.pos[0]+pt.nameP[0]
        const y = pt.pos[1]+pt.nameP[1]
        const xSgn = sgn(pt.nameP[0])
        const ySgn = sgn(pt.nameP[1])

        const distSq = pt.nameP[0] ** 2 + pt.nameP[1] ** 2
        if(distSq > 1200){
            ctx.beginPath()
            ctx.lineWidth = 2
            ctx.strokeStyle = "#999"
            const linkStart = coordTwinShrink([x, y], pt.pos, 18)
            ctx.moveTo(linkStart[0], linkStart[1])
            ctx.lineTo(x, y)
            ctx.stroke()
        }

        if(xSgn==-1)
            ctx.textAlign = 'right'
        else if(xSgn==0)
            ctx.textAlign = 'center'
        else
            ctx.textAlign = 'left'

        const nameLines = pt.name?.split('\n') || []
        const nameHeight = nameLines.length * cs.config.staNameRowHeight
        const nameSubLines = pt.nameS?.split('\n') || []
        const nameSubHeight = nameSubLines.length * cs.config.staNameSubRowHeight
        const totalHeight = nameHeight+nameSubHeight
        let yTop = y;
        if(ySgn == -1){
            yTop -= totalHeight
        }else if(ySgn == 0){
            yTop -= totalHeight/2
        }
        let biggestWidth = 0;
        ctx.textBaseline = 'middle'
        const render = (as:'fill'|'stroke', measure?:boolean)=>{
            ctx.fillStyle = cs.config.staNameColor
            ctx.font = cs.staNameFontStr
            for(let i=0; i<nameLines.length; i++){
                const yFromTop = (i + 0.5) * cs.config.staNameRowHeight
                let ty = yTop + yFromTop
                if(as=='stroke')
                    ctx.strokeText(nameLines[i], x, ty)
                else
                    ctx.fillText(nameLines[i], x, ty)
                if(measure){
                    const width = ctx.measureText(nameLines[i]).width
                    if(width > biggestWidth){
                        biggestWidth = width
                    }
                }
            }
            ctx.fillStyle = cs.config.staNameSubColor
            ctx.font = cs.staNameFontSubStr
            for(let i=0; i<nameSubLines.length; i++){
                const yFromTop = (i + 0.5) * cs.config.staNameSubRowHeight + nameHeight
                let ty = yTop + yFromTop
                if(as=='stroke')
                    ctx.strokeText(nameSubLines[i], x, ty)
                else
                    ctx.fillText(nameSubLines[i], x, ty)
                //判定框宽度只取决于主站名，副站名无视
            }
        }
        ctx.strokeStyle = cs.config.bgColor
        ctx.globalAlpha = 0.8
        ctx.lineWidth = cs.config.staNameFontSize/4
        ctx.lineJoin = 'round'
        render('stroke', needReportRect)
        ctx.globalAlpha = 1
        render('fill')

        if(markRoot){
            ctx.beginPath()
            if(markRoot == 'snapAccu')
                ctx.fillStyle = 'green'
            else if(markRoot == 'snapVague')
                ctx.fillStyle = 'orange'
            else
                ctx.fillStyle = 'red'
            ctx.arc(x, y, 4, 0, 2*Math.PI)
            ctx.fill()
        }

        if(needReportRect){
            let leftMost = x;
            let rightMost = x;
            if(xSgn == -1){
                leftMost -= biggestWidth
            }
            else if(xSgn == 0){
                leftMost -= biggestWidth/2
                rightMost += biggestWidth/2
            }else{
                rightMost += biggestWidth
            }
            const leftUpper:Coord = [leftMost, yTop]
            const rightLower:Coord = [rightMost, yTop+totalHeight]
            const rect:RectCoord = [leftUpper, rightLower]
            staNameRectStore.setStaNameRects(pt.id, rect)
        }
    }
    return { renderAllPtName, renderPtName, renderPtNameById }
})