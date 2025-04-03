import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useSaveStore } from "@/models/stores/saveStore";
import { ControlPoint, ControlPointLink, ControlPointLinkType, ControlPointSta } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { useStaClusterStore } from "@/models/stores/saveDerived/staClusterStore";
import { coordTwinShrink } from "@/utils/coordUtils/coordMath";
import { autoDash } from "@/utils/drawUtils/autoDash";
import { Coord } from "@/models/coord";

export const usePointLinkCvsWorker = defineStore('pointLinkCvsWorker',()=>{
    const saveStore = useSaveStore()
    const staClusterStore = useStaClusterStore()
    const cs = useConfigStore()
    function renderAllLinks(ctx:CvsContext, renderLayer:'carpet'|'body'|'core'){
        const links = saveStore.save?.pointLinks
        if(links){
            for(const link of links){
                renderLink(ctx, link, renderLayer)
            }
        }
    }
    function renderLink(ctx:CvsContext, link:ControlPointLink, renderLayer:'carpet'|'body'|'core'){
        const pts:ControlPoint[] = []
        for(const ptId of link.pts){
            const pt = saveStore.getPtById(ptId)
            if(pt)
                pts.push(pt)
            else
                return //已失效的link
        }
        if(pts.length<2)
            return
        const sizes = pts.map(x=>{return{id:x.id, size:staClusterStore.getMaxSizePtWithinCluster(x.id, 'ptSize')}})
        const sizeRatio = Math.min(...sizes.map(x=>x.size))
        if(link.type === ControlPointLinkType.fat){
            const bodyLineWidth = cs.config.ptStaLineWidth*3.5
            ctx.beginPath()
            if(renderLayer == 'carpet'){
                const carpetLineWidth = bodyLineWidth+cs.config.ptStaLineWidth
                ctx.lineWidth = carpetLineWidth*sizeRatio
                ctx.strokeStyle = cs.config.bgColor
            }
            else if(renderLayer == 'body'){
                ctx.lineWidth = bodyLineWidth*sizeRatio
                ctx.strokeStyle = cs.config.ptStaExchangeLineColor
            }else{
                const coreLineWidth = bodyLineWidth-2*cs.config.ptStaLineWidth
                ctx.lineWidth = coreLineWidth*sizeRatio
                ctx.strokeStyle = cs.config.ptStaFillColor
            }
            ctx.moveTo(...pts[0].pos)
            ctx.lineTo(...pts[1].pos)
            ctx.stroke()
        }
        else{
            let pt0Pos:Coord, pt1Pos:Coord;
            const lineWidth = cs.config.ptStaLineWidth * sizeRatio
            const carpetLineWidth = lineWidth * 2
            if(link.type === ControlPointLinkType.thin){
                pt0Pos = pts[0].pos
                pt1Pos = pts[1].pos
            }else{
                const carpetLineWidth = lineWidth * 2
                let pt0SizeRatio = 0
                let pt1SizeRatio = 0
                if(pts[0].sta === ControlPointSta.sta)
                    pt0SizeRatio = sizes.find(x=>x.id === pts[0].id)?.size ?? 1
                if(pts[1].sta === ControlPointSta.sta)
                    pt1SizeRatio = sizes.find(x=>x.id === pts[1].id)?.size ?? 1
                const shrinkUnit = cs.config.ptStaSize + cs.config.ptStaLineWidth*0.5
                const pt0ShrinkValue = pt0SizeRatio * shrinkUnit + carpetLineWidth*0.5
                const pt1ShrinkValue = pt1SizeRatio * shrinkUnit + carpetLineWidth*0.5
                pt0Pos = coordTwinShrink(pts[1].pos, pts[0].pos, pt0ShrinkValue)
                pt1Pos = coordTwinShrink(pts[0].pos, pts[1].pos, pt1ShrinkValue)
            }
            if (renderLayer == 'carpet') {
                ctx.beginPath()
                ctx.lineWidth = carpetLineWidth
                ctx.strokeStyle = cs.config.bgColor
                ctx.lineCap = 'round'
                ctx.moveTo(...pt0Pos)
                ctx.lineTo(...pt1Pos)
                ctx.stroke()
            }
            else if(renderLayer == 'body'){
                ctx.beginPath()
                if (link.type === ControlPointLinkType.thin) {
                    const bodyLineWidth = cs.config.ptStaLineWidth
                    ctx.lineWidth = bodyLineWidth * sizeRatio
                    ctx.strokeStyle = cs.config.ptStaExchangeLineColor
                    ctx.moveTo(...pts[0].pos)
                    ctx.lineTo(...pts[1].pos)
                    ctx.stroke()
                } else {
                    const dash = autoDash(pt0Pos, pt1Pos, lineWidth, lineWidth*2)
                    ctx.moveTo(...pt0Pos)
                    ctx.lineTo(...pt1Pos)
                    ctx.lineWidth = lineWidth
                    ctx.strokeStyle = cs.config.ptStaExchangeLineColor
                    ctx.lineCap = 'round'
                    ctx.setLineDash(dash)
                    ctx.stroke()
                    ctx.setLineDash([])
                }
            }
        }
    }
    return {
        renderAllLinks
    }
})