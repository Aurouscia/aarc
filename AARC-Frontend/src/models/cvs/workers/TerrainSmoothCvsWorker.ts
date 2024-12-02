import { Coord, SgnCoord, twinPts2SgnCoord, waysSort } from "@/models/coord";
import { LineType } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { useFormalizedLineStore } from "@/models/stores/saveDerived/formalizedLineStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { sqrt2half } from "@/utils/consts";
import { applyBias } from "@/utils/coordUtils/coordBias";
import { coordDist } from "@/utils/coordUtils/coordDist";
import { wayRel } from "@/utils/rayUtils/rayParallel";
import { defineStore } from "pinia";

type TerrainLink = { lineId: number, way: SgnCoord, dist: number, lineWidth:number }
type TerrainTransition = {center:Coord, linkA:TerrainLink, linkB:TerrainLink, color:string}

export const useTerrainSmoothCvsWorker = defineStore('terrainSmoothCvsWorker', ()=>{
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    const formalizedLineStore = useFormalizedLineStore()
    function renderAllTerrainSmooth(ctx:CanvasRenderingContext2D){
        const transitionGroups = findTerrainTransitions()
        const lineWidthBase = cs.config.lineWidth
        transitionGroups.forEach(transGroup=>{
            const curves:{mid:Coord, aWay:SgnCoord, bWay:SgnCoord}[] = []
            let smallestAdditionalBack = 1e10
            ctx.beginPath()
            ctx.fillStyle = transGroup.color
            let isFirstT = true
            transGroup.trans.forEach(t=>{
                const rel = wayRel(t.linkA.way, t.linkB.way)
                if(rel==='parallel')
                    return
                const aWidth = t.linkA.lineWidth * lineWidthBase
                const bWidth = t.linkB.lineWidth * lineWidthBase
                let aBack = bWidth / 2
                let bBack = aWidth / 2
                if(rel==='others'){
                    aBack *= sqrt2half
                    bBack *= sqrt2half
                }
                const noZeroWidthRatio = [t.linkA.lineWidth, t.linkB.lineWidth].filter(x=>x>0)
                const smallerWidthRatio = noZeroWidthRatio.length>0 ? Math.min(...noZeroWidthRatio) : 1 
                const restriction = Math.min(t.linkA.dist/2, t.linkB.dist/2)
                const biggerBack = Math.max(aBack, bBack)
                const left = restriction - biggerBack
                if(left <= 0)
                    return
                const targetRadius = cs.getTurnRadiusOf(smallerWidthRatio, rel=='perpendicular', 'middle')
                const additionalBack = Math.min(left, targetRadius)
                const mid = applyBias(applyBias(t.center, t.linkA.way, aBack), t.linkB.way, bBack)
                curves.push({mid, aWay:t.linkA.way, bWay:t.linkB.way})
                if(additionalBack<smallestAdditionalBack)
                    smallestAdditionalBack = additionalBack
            })
            curves.forEach(c=>{
                const a = applyBias(c.mid, c.aWay, smallestAdditionalBack)
                const b = applyBias(c.mid, c.bWay, smallestAdditionalBack)
                if(isFirstT){
                    ctx.moveTo(...a)
                    isFirstT = false
                }else{
                    ctx.lineTo(...a)
                }
                ctx.quadraticCurveTo(...c.mid, ...b)
            })
            ctx.closePath()
            ctx.fill()
        })
    }
    function findTerrainTransitions(){
        //找到所有属于多于一个地形的点
        const pointBelongTerrain:Record<string, {lineId:number, inLineIdx:number}[]|undefined> = {}
        saveStore.save?.lines.forEach(line=>{
            if(line.type===LineType.terrain){
                line.pts.forEach((pt,idx)=>{
                    const ptBelongLines = pointBelongTerrain[pt]
                    const belongObj = {lineId:line.id, inLineIdx:idx}
                    if(ptBelongLines)
                        ptBelongLines.push(belongObj)
                    else
                        pointBelongTerrain[pt] = [belongObj]
                })
            }
        })
        const mutiTerrainPts:{ptId:number, belongs:{lineId:number, inLineIdx:number}[]}[] = []
        const relatedLineIds = new Set<number>([])
        Object.entries(pointBelongTerrain).forEach(([key, value]) => {
            if(value && value.length>1){
                const ptId = parseInt(key)
                mutiTerrainPts.push({ptId, belongs:value})
                value.forEach(line=>relatedLineIds.add(line.lineId))
            }
        })

        //分析每个属于多余一个地形的点，按延伸出的线的方位角排序
        
        const junctions: { ptPos: Coord, links: TerrainLink[] }[] = []
        mutiTerrainPts.forEach(pt => {
            const selfPos = saveStore.getPtById(pt.ptId)?.pos
            if (!selfPos)
                return
            const adjss: { pos: Coord, belongLine: number }[] = []
            pt.belongs.forEach(belong => {
                const adjPoss = formalizedLineStore.findAdjacentFormatPts(belong.inLineIdx, belong.lineId)
                const adjs = adjPoss.map(x => { return { pos: x, belongLine: belong.lineId } })
                adjss.push(...adjs)
            })
            const linksHere: TerrainLink[] = []
            adjss.forEach(adj => {
                const adjWay = twinPts2SgnCoord(selfPos, adj.pos)
                const dist = coordDist(selfPos, adj.pos)
                linksHere.push({ lineId: adj.belongLine, way: adjWay, dist, lineWidth:1 })
            })
            waysSort(linksHere, x => x.way)
            junctions.push({ ptPos: selfPos, links: linksHere })
        })

        //同一个点围绕的连接，记录相邻且属于不同地形（颜色相同）的对
        const transitions:{color:string, trans:TerrainTransition[]}[] = []
        const relatedLines = saveStore.getLinesByIds(relatedLineIds)
        junctions.forEach(jun=>{
            if(jun.links.length<2)
                return
            const transHere:TerrainTransition[] = []
            let linkA = jun.links[jun.links.length-1]
            let lineA = relatedLines.find(x=>x.id===linkA.lineId)
            const firstLine = lineA
            if(!firstLine)
                return
            const firstLineColor = saveStore.getLineActualColor(firstLine)
            for(let i=0;i<jun.links.length;i++){
                let linkB = jun.links[i]
                if(linkB.lineId === linkA.lineId){
                    linkA = linkB
                    continue
                }
                const lineB = relatedLines.find(x=>x.id===linkB.lineId)
                if(lineA && lineB){
                    //确保junction的每一条线都颜色一致
                    if(saveStore.linesActualColorSame(firstLine, lineB)){
                        linkA.lineWidth = lineA.width || 1
                        linkB.lineWidth = lineB.width || 1
                        if(lineA.isFilled)
                            linkA.lineWidth = 0
                        if(lineB.isFilled)
                            linkB.lineWidth = 0
                        const trans:TerrainTransition = {
                            center:jun.ptPos,
                            linkA,
                            linkB,
                            color:saveStore.getLineActualColor(lineA)
                        }
                        transHere.push(trans)
                    }
                }
                lineA = lineB
                linkA = linkB
            }
            if(transHere.length>0){
                transitions.push({color:firstLineColor, trans:transHere})
            }
        })
        return transitions
    }

    return { renderAllTerrainSmooth }
})