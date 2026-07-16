import { ControlPoint } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { useStaNameMainRectStore, useStaNameRectStore } from "@/models/stores/saveDerived/staNameRectStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { coordAdd, coordTwinShrink } from "@/utils/coordUtils/coordMath";
import { drawText } from "@/utils/drawUtils/drawText";
import { sgn } from "@/utils/sgn";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useCvsBlocksControlStore } from "../common/cvs";
import { Coord, SgnCoord } from "@/models/coord";
import { useStaClusterStore } from "@/models/stores/saveDerived/staClusterStore";
import { useCvsFrameStore } from "@/models/stores/cvsFrameStore";
import { useEditorLocalConfigStore } from "@/app/localConfig/editorLocalConfig";
import { drawRect } from "@/utils/drawUtils/drawRect";
import { sqrt2 } from "@/utils/consts";

//糊弄阈值
const staNameFobThrsBase = 0.000001

//为 renderAllPtName 批量渲染站名时预计算的聚类信息，
//避免对每个站点重复执行 O(C×S) 的 cluster 扫描和尺寸最大值计算。
interface StaNamePrecomputed{
    //点 id 到其所属 cluster 的映射；未聚类的单点对应 undefined
    clusterForPt: Map<number, ControlPoint[] | undefined>
    //每个 cluster 内三种尺寸的最大值，以 cluster 数组引用作为 key
    clusterMaxSizes: Map<ControlPoint[], { ptSize:number, ptNameSize:number, ptNameSnapSize:number }>
}

export const useStaNameCvsWorker = defineStore('staNameCvsWorker', ()=>{
    const saveStore = useSaveStore()
    const staNameRectStore = useStaNameRectStore()
    const staNameMainRectStore = useStaNameMainRectStore()
    const cvsBlocksControlStore = useCvsBlocksControlStore()
    const staClusterStore = useStaClusterStore()
    const editorLocalConfigStore = useEditorLocalConfigStore()
    const cs = useConfigStore()
    const cvsFrameStore = useCvsFrameStore()
    let viewRectArea = 0
    function renderAllPtName(ctx:CvsContext, needReportRectPts?:number[], noOmit?:boolean){
        if(!saveStore.save)
            return;
        const pts = saveStore.save.points;
        const viewRect = cvsFrameStore.getViewRectSideLengths()
        viewRectArea = viewRect[0] * viewRect[1]
        //预计算聚类索引与尺寸缓存：renderPtName 原本每个站点要 3 次
        //在 clusters 中线性查找所属 cluster 并重复计算最大值，大地图下极慢。
        //这里一次性完成，后续查找均为 O(1)。
        const clusters = staClusterStore.getStaClusters() || []
        const clusterForPt = new Map<number, ControlPoint[] | undefined>()
        clusters.forEach(cluster=>{
            cluster.forEach(pt=>{
                clusterForPt.set(pt.id, cluster)
            })
        })
        const clusterMaxSizes = new Map<ControlPoint[], { ptSize:number, ptNameSize:number, ptNameSnapSize:number }>()
        clusters.forEach(cluster=>{
            clusterMaxSizes.set(cluster, {
                ptSize: Math.max(1, ...cluster.map(pt => saveStore.getLinesDecidedPtSize(pt.id))),
                ptNameSize: Math.max(1, ...cluster.map(pt => saveStore.getLinesDecidedPtNameSize(pt.id))),
                ptNameSnapSize: Math.max(1, ...cluster.map(pt => saveStore.getLinesDecidedPtNameSnapSize(pt.id)))
            })
        })
        const precomputed: StaNamePrecomputed = { clusterForPt, clusterMaxSizes }
        pts.forEach(pt=>{
            const needReportRect = !needReportRectPts || needReportRectPts.includes(pt.id)
            renderPtName(ctx, pt, needReportRect, undefined, noOmit, precomputed)
        })
    }
    function renderPtNameById(ctx:CvsContext, ptId:number, needReportRect?:boolean, markRoot?:'free'|'snapVague'|'snapAccu'){
        const pt = saveStore.getPtById(ptId);
        if(pt)
            return renderPtName(ctx, pt, needReportRect, markRoot)
    }
    function renderPtName(ctx:CvsContext, pt:ControlPoint, needReportRect?:boolean, markRoot?:'free'|'snapVague'|'snapAccu', noOmit = false, precomputed?: StaNamePrecomputed){
        if(!pt.nameP)
            return;
        const globalPos = coordAdd(pt.pos, pt.nameP)
        if((!noOmit && checkOmittable(globalPos)))
            return
        //读取站点所属 cluster 的预计算最大尺寸；
        //无预计算结果时（如 renderPtNameById 单独调用）回退到原接口。
        function getClusterMaxSize(sizeType:'ptSize'|'ptNameSize'|'ptNameSnapSize'):number{
            if(precomputed){
                const cluster = precomputed.clusterForPt.get(pt.id)
                if(cluster){
                    const sizes = precomputed.clusterMaxSizes.get(cluster)
                    if(sizes) return sizes[sizeType]
                }
                //未聚类的单点：直接取该点自身尺寸
                if(sizeType === 'ptSize') return saveStore.getLinesDecidedPtSize(pt.id)
                if(sizeType === 'ptNameSize') return saveStore.getLinesDecidedPtNameSize(pt.id)
                return saveStore.getLinesDecidedPtNameSnapSize(pt.id)
            }
            return staClusterStore.getMaxSizePtWithinCluster(pt.id, sizeType)
        }
        //字体大小：优先使用pt内设置的值，若pt内的值为undefined或0，再去找cluster内最大的
        const fontSizeRatio = Number(pt.nameSize) || getClusterMaxSize('ptNameSize')
        const rowHeight = cs.config.staNameRowHeight * fontSizeRatio
        if(!noOmit){
            //决定要不要糊弄
            const rowToAreaRatio = rowHeight / viewRectArea
            const thrs = staNameFobThrsBase * (Number(editorLocalConfigStore.staNameFob) || 1)
            const fob = rowToAreaRatio < thrs
            if(fob){
                const rect = staNameMainRectStore.getStaNameMainRect(pt.id)
                if(rect){
                    let oriAlpha = ctx.globalAlpha || 1
                    ctx.globalAlpha = 0.4
                    ctx.fillStyle = '#666'
                    const width = rect[1][0] - rect[0][0]
                    const height = rect[1][1] - rect[0][1]
                    ctx.fillRect(...rect[0], width, height)
                    ctx.globalAlpha = oriAlpha
                    return
                }
            }
        }
        const alignX = pt.anchorX ?? sgn(pt.nameP[0])
        const alignY = pt.anchorY ?? sgn(pt.nameP[1])
        const align:SgnCoord = [alignX, alignY]
        const ptSizeRatio = getClusterMaxSize('ptSize')
        const ptRadius = ptSizeRatio * cs.config.ptStaSize

        let drawLeader:boolean
        if(typeof pt.noLeader == 'boolean'){
            drawLeader = !pt.noLeader
        } else {
            const dist = Math.sqrt(pt.nameP[0] ** 2 + pt.nameP[1] ** 2)
            const snapDistRatio = getClusterMaxSize('ptNameSnapSize')
            const snapDist = cs.config.snapOctaClingPtNameDist * snapDistRatio
            drawLeader = dist > (snapDist * sqrt2 + 0.01)
        }
         
        if(drawLeader){
            ctx.beginPath()
            ctx.lineWidth = 2*fontSizeRatio
            ctx.strokeStyle = "#999"
            const nodeDistToCenter = ptRadius * 1.6
            const linkStart = coordTwinShrink(globalPos, pt.pos, nodeDistToCenter)
            ctx.moveTo(linkStart[0], linkStart[1])
            ctx.lineTo(...globalPos)
            ctx.stroke()
        }

        const rects = drawText(ctx, globalPos, align, undefined, {
            text: pt.name,
            color: cs.config.staNameColor,
            font: cs.config.staNameFont,
            weight: cs.config.staNameFontWeight,
            style: cs.config.staNameFontStyle,
            fontSize: cs.config.staNameFontSize * fontSizeRatio,
            rowHeight: cs.config.staNameRowHeight * fontSizeRatio
        },{
            text: pt.nameS,
            color: cs.config.staNameSubColor,
            font: cs.config.staNameSubFont,
            weight: cs.config.staNameSubFontWeight,
            style: cs.config.staNameSubFontStyle,
            fontSize: cs.config.staNameSubFontSize * fontSizeRatio,
            rowHeight: cs.config.staNameSubRowHeight * fontSizeRatio
        },
        {
            width: cs.config.staNameFontSize * fontSizeRatio/4,
            color: cs.config.bgColor,
            opacity: 0.8
        }, needReportRect ? 'both' : 'draw')

        if(rects){
            staNameRectStore.setStaNameRect(pt.id, rects.rectFull)
            staNameMainRectStore.setStaNameMainRect(pt.id, rects.rectMain)
            if(markRoot){
                drawRect(ctx, rects.rectFull)
            }
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