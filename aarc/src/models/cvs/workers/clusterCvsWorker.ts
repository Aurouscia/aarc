import { ControlPoint, ControlPointDir, ControlPointSta } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { Coord } from "@/models/coord";
import { useStaClusterStore } from "@/models/stores/saveDerived/staClusterStore";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useSaveStore } from "@/models/stores/saveStore";
import { useFreePtDirectionStore } from "@/models/stores/saveDerived/freePtDirectionStore";
import { clusterToPolyMinimumArea, clusterToPolyVert, clusterToPolyInc } from "@/utils/clusterUtils/clusterPolyAngle";
import { usePointLinkStore } from "@/models/stores/pointLinkStore";
import { isZero } from "@/utils/sgn";

interface ClusterPoly{
    coords:Coord[]
    maxStaSize:number
    ill:boolean
    isFromLink?:boolean
}
export const useClusterCvsWorker = defineStore('clusterCvsWorker', ()=>{
    const staClusterStore = useStaClusterStore()
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    const pointLinkStore = usePointLinkStore()
    const freePtDirectionStore = useFreePtDirectionStore()

    function getClustersRenderingData(){
        let clusters = staClusterStore.getStaClusters() || []
        //伪集群：“点连接”的两端，若不属于集群，需要被涂成集群的样式
        //但需要排除类型为“dot”的点连接，dot连接需要保持原色，而dotCover需要涂色
        const fakeClusters = pointLinkStore.getLinkLinkedPts('excludeDot')
        for(const fakeCluster of fakeClusters){
            const pt = saveStore.getPtById(fakeCluster)
            if(!pt || pt.sta !== ControlPointSta.sta)
                continue
            if(clusters.some(c=>c.some(x=>x.id===fakeCluster)))
                continue
            clusters = [...clusters, [pt]]
        }
        const polys = clustersToPolys(clusters)
        const polysByLink = clustersToPolys(pointLinkStore.getClusterLinksPts(), 'asIs')
        polysByLink.forEach(p=>p.isFromLink=true)
        polys.push(...polysByLink)
        return polys
    }

    function renderClusters(ctx:CvsContext, data:ClusterPoly[], 
        renderLayer:'carpet'|'body'|'core', transparentMode?:boolean, linkMark?:boolean
    ){
        const forEachPoly = (
            getLineWidth:(size:number)=>number,
            color:string,
            mustFill?:'mustFill'|false,
            filter?:(p:ClusterPoly)=>boolean
        )=>{
            for(const p of data){
                if(filter){
                    if(!filter(p))
                        continue
                }
                const w = getLineWidth(p.maxStaSize)
                if(!p.ill){
                    ctx.beginPath();
                    const firstPos = p.coords[0]
                    ctx.moveTo(...firstPos)
                    for(let i=1;i<p.coords.length;i++){
                        ctx.lineTo(p.coords[i][0], p.coords[i][1])
                    }
                    ctx.closePath()
                    ctx.lineWidth = w
                    ctx.strokeStyle = color
                    ctx.stroke()
                    if(mustFill){
                        ctx.fillStyle = color
                        ctx.fill()
                    }
                }else{
                    ctx.beginPath();
                    const firstPos = p.coords[0]
                    ctx.arc(...firstPos, w/2, 0, Math.PI*2)
                    ctx.fillStyle = color
                    ctx.fill()
                }
            }
        }
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        const bgColor = cs.config.bgColor;
        const exchangeColor = cs.config.ptStaExchangeLineColor;

        
        if(transparentMode){
            if(renderLayer != 'carpet'){
                return
            }
            ctx.globalAlpha = 0.7
            forEachPoly((size)=>{
                return (cs.config.ptStaSize + cs.config.ptStaLineWidth) * size * 2
            }, exchangeColor)
            ctx.globalAlpha = 1
            return
        }

        if(renderLayer == 'carpet'){
            forEachPoly((size)=>{
                return (cs.config.ptStaSize + cs.config.ptStaLineWidth) * size * 2
            }, bgColor)
        }
        else if(renderLayer == 'body'){
            forEachPoly((size) => {
                return ((cs.config.ptStaSize * 2) + cs.config.ptStaLineWidth) * size
            }, exchangeColor)
        }
        else{
            ctx.strokeStyle = cs.config.ptStaFillColor
            ctx.fillStyle = cs.config.ptStaFillColor
            forEachPoly((size) => {
                return ((cs.config.ptStaSize * 2) - cs.config.ptStaLineWidth) * size
            }, cs.config.ptStaFillColor, 'mustFill')
        }
        if(linkMark){
            forEachPoly((size)=>{
                return cs.config.ptStaLineWidth * size / 3
            }, '#ccc', false, p=>p.isFromLink??false)
        }
    }

    /**
     * 计算两个单位方向的角平分线方向（归一化）。
     * 当两方向反向（和接近零向量）时返回 undefined，避免退化。
     */
    function bisectorDir(u: Coord | undefined, v: Coord | undefined): Coord | undefined {
        if (!u || !v) return undefined
        const sum: Coord = [u[0] + v[0], u[1] + v[1]]
        const len = Math.hypot(sum[0], sum[1])
        if (isZero(len)) return undefined
        return [sum[0] / len, sum[1] / len]
    }

    function clustersToPolys(clusters:ControlPoint[][], asIs?:'asIs'):ClusterPoly[]{
        const polys:ClusterPoly[] = []
        clusters.forEach(c=>{
            const sizes = c.map(x=>saveStore.getLinesDecidedPtSize(x.id))
            if(sizes.length==0)
                return
            let poly:Coord[] = []
            const maxStaSize = Math.max(...sizes)
            if(asIs){
                poly = c.map(x=>x.pos)
            }
            else if(c.some(x=>x.free)){
                const directions = c
                    .filter(x=>x.free)
                    .flatMap(x => {
                        const info = freePtDirectionStore.getPtDirectionInfo(x.id)
                        if (!info) return []
                        const bisector = bisectorDir(info.prev?.dir, info.next?.dir)
                        return bisector ? [...info.all, bisector] : [...info.all]
                    })
                const best = directions.length > 0
                    ? clusterToPolyMinimumArea(c, directions)
                    : clusterToPolyVert(c)
                poly = best.poly
            }
            else{
                const vertCount = c.filter(x=>x.dir===ControlPointDir.vertical).length
                const incCount = c.filter(x=>x.dir===ControlPointDir.incline).length
                if(incCount===0){
                    const polyVert = clusterToPolyVert(c)
                    poly = polyVert.poly
                }
                else if(vertCount===0){
                    const polyInc = clusterToPolyInc(c)
                    poly = polyInc.poly
                }
                else{
                    const polyVert = clusterToPolyVert(c)
                    const polyInc = clusterToPolyInc(c)
                    if(polyInc.area < polyVert.area){
                        poly = polyInc.poly
                    }else{
                        poly = polyVert.poly
                    }
                }
            }
            polys.push({
                coords:poly,
                maxStaSize,
                ill:isIllPosedPoly(poly)
            })
        })
        return polys
    }
    function isIllPosedPoly(poly:Coord[]){
        if(poly.length!=4)
            return false
        const xs = poly.map(x=>x[0])
        const ys = poly.map(x=>x[1])
        const xmin = Math.min(...xs)
        const xmax = Math.max(...xs)
        const ymin = Math.min(...ys)
        const ymax = Math.max(...ys)
        if(isZero(xmax-xmin) && isZero(ymax-ymin)){
            return true
        }
        return false
    }
    return {
        getClustersRenderingData, 
        renderClusters
    }
})