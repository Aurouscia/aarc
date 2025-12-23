import { Coord, SgnCoord, twinPts2SgnCoord, waysSort } from "@/models/coord";
import { LineType } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { useFormalizedLineStore } from "@/models/stores/saveDerived/formalizedLineStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { sqrt2 } from "@/utils/consts";
import { applyBias } from "@/utils/coordUtils/coordBias";
import { coordDist } from "@/utils/coordUtils/coordDist";
import { drawArcByThreePoints } from "@/utils/drawUtils/drawArc";
import { WayRel, wayRel } from "@/utils/rayUtils/rayParallel";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useLineStateStore } from "@/models/stores/saveDerived/state/lineStateStore";

type TerrainLink = { lineId: number, inLineIdx:number, way: SgnCoord, dist: number, lineWidth:number }
type TerrainTransition = {center:Coord, linkA:TerrainLink, linkB:TerrainLink, color:string}

export const useTerrainSmoothCvsWorker = defineStore('terrainSmoothCvsWorker', ()=>{
    const saveStore = useSaveStore()
    const lineStateStore = useLineStateStore()
    const cs = useConfigStore()
    const formalizedLineStore = useFormalizedLineStore()
    function renderAllTerrainSmooth(ctx:CvsContext, renderType: 'body'|'carpet'){
        const transitionGroups = findTerrainTransitions()
        const lineWidthBase = cs.config.lineWidth
        transitionGroups.forEach(transGroup=>{
            const curves:{center:Coord, mid:Coord, aWay:SgnCoord, bWay:SgnCoord, rel:WayRel}[] = []
            //保持同角度的圆角半径一致
            let smallestAdditionalBack:Record<WayRel, number> 
                = {'45':1e10, '90':1e10, '135':1e10, 'parallel':0}
            ctx.beginPath()
            let isFirstT = true
            transGroup.trans.forEach(t=>{
                const rel = wayRel(t.linkA.way, t.linkB.way, true)
                if(rel==='parallel')
                    return
                const aWidth = t.linkA.lineWidth * lineWidthBase
                const bWidth = t.linkB.lineWidth * lineWidthBase
                const widthDiff = Math.abs(aWidth - bWidth)
                let aBack = bWidth / 2
                let bBack = aWidth / 2
                if(rel==='45' || rel === '135'){
                    aBack *= sqrt2
                    bBack *= sqrt2
                    aBack -= 0.5 //不少后退点就有莫名其妙的缝隙
                    bBack -= 0.5
                }
                const noZeroWidthRatio = [t.linkA.lineWidth, t.linkB.lineWidth].filter(x=>x>0)
                const smallerWidthRatio = noZeroWidthRatio.length>0 ? Math.min(...noZeroWidthRatio) : 1 
                const restriction = Math.min(t.linkA.dist/2, t.linkB.dist/2)
                const biggerBack = Math.max(aBack, bBack)
                const left = restriction - biggerBack
                if(left <= widthDiff/3)
                    return //当余量小于线条宽度之差的1/3（其实应该是1/2，这里放松了）就放弃渲染
                const targetRadius = cs.getTurnRadiusOf(smallerWidthRatio, rel, 'middle')
                const additionalBack = Math.min(left, targetRadius)
                const mid = applyBias(applyBias(t.center, t.linkA.way, aBack), t.linkB.way, bBack)
                curves.push({center:t.center, mid, aWay:t.linkA.way, bWay:t.linkB.way, rel})
                if(additionalBack<smallestAdditionalBack[rel])
                    smallestAdditionalBack[rel] = additionalBack
            })
            curves.forEach(c=>{
                const a = applyBias(c.mid, c.aWay, smallestAdditionalBack[c.rel])
                const b = applyBias(c.mid, c.bWay, smallestAdditionalBack[c.rel])
                if(isFirstT){
                    ctx.moveTo(...c.center)
                    isFirstT = false
                }
                ctx.lineTo(...a)
                drawArcByThreePoints(ctx, a, c.mid, b)
            })
            ctx.closePath()
            if(renderType=='carpet'){
                ctx.strokeStyle = cs.config.bgColor
                ctx.lineWidth = cs.config.lineCarpetWiden
                ctx.stroke()
            }
            else if(renderType=='body'){
                ctx.fillStyle = transGroup.color
                ctx.fill()
            }
        })
    }
    function findTerrainTransitions(){
        //找到所有属于多于一个地形的点
        const pointBelongTerrain:Map<number, {lineId:number, inLineIdx:number}[]> = new Map()
        saveStore.save?.lines.forEach(line=>{
            if(line.type===LineType.terrain){
                line.pts.forEach((pt,idx)=>{
                    const ptBelongLines = pointBelongTerrain.get(pt)
                    const belongObj = {lineId:line.id, inLineIdx:idx}
                    if(ptBelongLines)
                        ptBelongLines.push(belongObj)
                    else
                        pointBelongTerrain.set(pt, [belongObj])
                })
            }
        })
        const mutiTerrainPts:{ptId:number, belongs:{lineId:number, inLineIdx:number}[]}[] = []
        const relatedLineIds = new Set<number>([])
        pointBelongTerrain.forEach((belongs, ptId)=>{
            if(belongs.length>1){
                mutiTerrainPts.push({ptId, belongs})
                belongs.forEach(line=>relatedLineIds.add(line.lineId))
            }
        })

        //分析每个属于多于一个地形的点，按延伸出的线的方位角排序
        
        const junctions: { ptPos: Coord, links: TerrainLink[] }[] = []
        mutiTerrainPts.forEach(pt => {
            const selfPos = saveStore.getPtById(pt.ptId)?.pos
            if (!selfPos)
                return
            const adjss: { pos: Coord, belongLine: number, belongInLineIdx:number }[] = []
            pt.belongs.forEach(belong => {
                const adjPoss = formalizedLineStore.findAdjacentFormalPts(belong.inLineIdx, belong.lineId)
                const adjs = adjPoss.map(x => ({ pos: x, belongLine: belong.lineId, belongInLineIdx: belong.inLineIdx }))
                adjss.push(...adjs)
            })
            const linksHere: TerrainLink[] = []
            adjss.forEach(adj => {
                const adjWay = twinPts2SgnCoord(selfPos, adj.pos)
                const dist = coordDist(selfPos, adj.pos)
                linksHere.push({ lineId: adj.belongLine, way: adjWay, dist, lineWidth:1, inLineIdx:adj.belongInLineIdx })
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
            let onlyColor:string|undefined = undefined
            for(let lk of jun.links){
                let colorHere = lineStateStore.getLineActualColorById(lk.lineId)
                if(onlyColor === undefined)
                    onlyColor = colorHere
                else{
                    if(!colorHere || colorHere !== onlyColor){
                        return // 中止，不再创建transition
                    }
                }
            }
            if(!onlyColor)
                return
            const transHere:TerrainTransition[] = []
            let linkA = jun.links[jun.links.length-1]
            let lineA = relatedLines.find(x=>x.id===linkA.lineId)
            if(!lineA)
                return
            for(let i=0; i<jun.links.length; i++){
                let linkB = jun.links[i]
                if(linkB.lineId === linkA.lineId){
                    linkA = linkB // TODO：无法支持自交（不只是这里的问题）
                    continue
                }
                const lineB = relatedLines.find(x=>x.id===linkB.lineId)
                if(!lineB)
                    return
                linkA.lineWidth = lineA.width || 1
                linkB.lineWidth = lineB.width || 1
                if (lineA.isFilled)
                    linkA.lineWidth = 0
                if (lineB.isFilled)
                    linkB.lineWidth = 0
                const trans: TerrainTransition = {
                    center: jun.ptPos,
                    linkA,
                    linkB,
                    color: onlyColor
                }
                transHere.push(trans)
                lineA = lineB
                linkA = linkB
            }
            if(transHere.length>0){
                transitions.push({color:onlyColor, trans:transHere})
            }
        })
        return transitions
    }

    return { renderAllTerrainSmooth }
})