import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useSaveStore } from "@/models/stores/saveStore";
import { ControlPoint, ControlPointLink, ControlPointLinkType } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { useStaClusterStore } from "@/models/stores/saveDerived/staClusterStore";

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
        const sizes = pts.map(x=>staClusterStore.getMaxSizePtWithinCluster(x.id, 'ptSize'))
        const sizeRatio = Math.min(...sizes)
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
        //TODO: 其他类型的link
    }
    return {
        renderAllLinks
    }
})