import { ControlPoint, ControlPointDir } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { Coord } from "@/models/coord";
import { useStaClusterStore } from "@/models/stores/saveDerived/staClusterStore";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useSaveStore } from "@/models/stores/saveStore";
import { sqrt2half } from "@/utils/consts";

interface ClusterPoly{
    coords:Coord[]
    maxStaSize:number
}
export const useClusterCvsWorker = defineStore('clusterCvsWorker', ()=>{
    const staClusterStore = useStaClusterStore()
    const saveStore = useSaveStore()
    const cs = useConfigStore()

    function renderClusters(ctx:CvsContext){
        const clusters = staClusterStore.getStaClusters()
        if(!clusters)
            return;
        const polys = clustersToPolys(clusters)
        const forEachPoly = (doSth:(size:number)=>void)=>{
            for(const p of polys){
                ctx.beginPath();
                const firstPos = p.coords[0]
                ctx.moveTo(firstPos[0], firstPos[1])
                for(let i=1;i<p.coords.length;i++){
                    ctx.lineTo(p.coords[i][0], p.coords[i][1])
                }
                ctx.closePath()
                doSth(p.maxStaSize)
            }
        }
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        const bgColor = cs.config.bgColor;
        const exchangeColor = cs.config.ptStaExchangeLineColor;
        ctx.strokeStyle = bgColor
        forEachPoly((size)=>{
            const rectLineWidth = (cs.config.ptStaSize + cs.config.ptStaLineWidth) * size * 2
            ctx.lineWidth = rectLineWidth
            ctx.stroke()
        })
            
        ctx.strokeStyle = exchangeColor
        forEachPoly((size) => {
            const rectLineWidth = ((cs.config.ptStaSize * 2) + cs.config.ptStaLineWidth) * size
            ctx.lineWidth = rectLineWidth
            ctx.stroke()
        })
        ctx.strokeStyle = cs.config.ptStaFillColor
        ctx.fillStyle = cs.config.ptStaFillColor
        forEachPoly((size) => {
            const rectLineWidth = ((cs.config.ptStaSize * 2) - cs.config.ptStaLineWidth) * size
            ctx.lineWidth = rectLineWidth
            ctx.fill()
            ctx.stroke()
        })
    }

    function clustersToPolys(clusters:ControlPoint[][]):ClusterPoly[]{
        const polys:ClusterPoly[] = []
        clusters.forEach(c=>{
            const sizes = c.map(x=>saveStore.getLinesDecidedPtSize(x.id))
            if(sizes.length==0)
                return
            const maxStaSize = Math.max(...sizes)
            const vertCount = c.filter(x=>x.dir===ControlPointDir.vertical).length
            const incCount = c.filter(x=>x.dir===ControlPointDir.incline).length

            let poly:Coord[] = []
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
            polys.push({coords:poly, maxStaSize})
        })
        return polys
    }
    function clusterToPolyVert(cluster:ControlPoint[]){
        let l = 1e10
        let r = -1e10
        let t = 1e10
        let b = -1e10
        for(let i=0; i<cluster.length; i++){
            const [x,y] = cluster[i].pos
            if(x < l)
                l = x
            if(x > r)
                r = x
            if(y < t)
                t = y
            if(y > b)
                b = y
        }
        const poly:Coord[] = [[l,t], [r,t], [r,b], [l,b]]
        const area = (r-l)*(b-t)
        return {poly,area}
    }
    function clusterToPolyInc(cluster:ControlPoint[]){
        let lt = 1e10
        let rb = -1e10
        let lb = 1e10
        let rt = -1e10
        for(let i=0; i<cluster.length; i++){
            const [x,y] = cluster[i].pos
            const sum = x+y;
            const diff = x-y;
            if(sum < lt)
                lt = sum
            if(sum > rb)
                rb = sum
            if(diff < lb)
                lb = diff
            if(diff > rt)
                rt = diff
        }
        const t:Coord = [(lt+rt)/2, (lt-rt)/2]
        const l:Coord = [(lt+lb)/2, (lt-lb)/2]
        const r:Coord = [(rb+rt)/2, (rb-rt)/2]
        const b:Coord = [(rb+lb)/2, (rb-lb)/2]
        const poly:Coord[] = [t,l,b,r]
        const lt2rb = (rb-lt)*sqrt2half
        const rt2lb = (rt-lb)*sqrt2half
        const area = lt2rb * rt2lb
        return {poly,area}
    }
    return { renderClusters }
})