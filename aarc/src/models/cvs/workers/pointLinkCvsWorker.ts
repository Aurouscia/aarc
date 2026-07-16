import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useSaveStore } from "@/models/stores/saveStore";
import { ControlPoint, ControlPointLink, ControlPointLinkType, ControlPointSta } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { useStaClusterStore } from "@/models/stores/saveDerived/staClusterStore";
import { coordTwinShrink } from "@/utils/coordUtils/coordMath";
import { autoDash } from "@/utils/drawUtils/autoDash";
import { Coord } from "@/models/coord";
import { useCvsBlocksControlStore } from "../common/cvs";
import { useRenderOptionsStore } from "@/models/stores/renderOptionsStore";

export const usePointLinkCvsWorker = defineStore('pointLinkCvsWorker',()=>{
    const saveStore = useSaveStore()
    const staClusterStore = useStaClusterStore()
    const cs = useConfigStore()
    const cvsBlocksControlStore = useCvsBlocksControlStore()
    const renderOptionsStore = useRenderOptionsStore()
    function renderAllLinks(ctx:CvsContext, renderLayer:'carpet'|'body'|'core'){
        const links = saveStore.save?.pointLinks
        if(links){
            for(const link of links){
                const pts:ControlPoint[] = []
                for(const ptId of link.pts){
                    const pt = saveStore.getPtById(ptId)
                    if(pt)
                        pts.push(pt)
                }
                if(pts.length<2)
                    continue //已失效的link
                if(pts[0].id === pts[1].id)
                    continue //同一点
                const sizes = pts.map(x=>{return{id:x.id, size:staClusterStore.getMaxSizePtWithinCluster(x.id, 'ptSize')}})
                const sizeRatio = Math.min(...sizes.map(x=>x.size))
                if(!renderOptionsStore.exporting && checkOmittableLink(pts, sizeRatio))
                    continue
                renderLink(ctx, link, renderLayer, pts, sizes, sizeRatio)
            }
        }
    }
    function checkOmittableLink(pts:ControlPoint[], sizeRatio:number){
        const { cvsWidth, cvsHeight } = saveStore
        const { left, right, top, bottom } = cvsBlocksControlStore.blockTotalBoundary
        // fat link carpet 最宽：(ptStaLineWidth*3.5 + ptStaLineWidth) * sizeRatio
        const maxLineWidth = (cs.config.ptStaLineWidth * 3.5 + cs.config.ptStaLineWidth) * sizeRatio
        const padding = maxLineWidth / 2
        const minX = Math.min(pts[0].pos[0], pts[1].pos[0]) - padding
        const maxX = Math.max(pts[0].pos[0], pts[1].pos[0]) + padding
        const minY = Math.min(pts[0].pos[1], pts[1].pos[1]) - padding
        const maxY = Math.max(pts[0].pos[1], pts[1].pos[1]) + padding
        if(maxX/cvsWidth < left)
            return true
        if(minX/cvsWidth > right)
            return true
        if(maxY/cvsHeight < top)
            return true
        if(minY/cvsHeight > bottom)
            return true
        return false
    }
    function renderLink(ctx:CvsContext, link:ControlPointLink, renderLayer:'carpet'|'body'|'core', pts:ControlPoint[], sizes:{id:number, size:number}[], sizeRatio:number){
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
                //type 为 dot 或 dotCover
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
                    //type 为 dot 或 dotCover
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