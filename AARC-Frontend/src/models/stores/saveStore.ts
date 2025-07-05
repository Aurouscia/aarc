import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { ControlPoint, ControlPointDir, ControlPointLink, ControlPointSta, ensureValidCvsSize, Line, LineType, Save, saveLineCount, saveStaCount } from "../save";
import { Coord } from "../coord";
import { isSameCoord } from "@/utils/sgn";
import { useConfigStore } from "./configStore";
import { indicesInArray, pullAllByPred, removeAllByIndices, removeAllByPred } from "@/utils/lang/indicesInArray";
import { coordAdd } from "@/utils/coordUtils/coordMath";
import { getMayRingLinePtIds } from "@/utils/lineUtils/isRing";
import { readNumKeyedRecord } from "@/utils/lang/readNumKeyedRecord";
import { keepOrderSort } from "@/utils/lang/keepOrderSort";

export const useSaveStore = defineStore('save', () => {
    //不应直接在此删除/添加车站/线路，应通过envStore进行，避免数据不一致
    const save = ref<Save>()
    const configStore = useConfigStore()
    const ptDict = computed<Record<number, ControlPoint|undefined>>(()=>{
        const res:Record<number, ControlPoint|undefined> = {}
        if(!save.value?.points)
            return res
        for(const pt of save.value.points){
            res[pt.id] = pt
        }
        return res
    })
    const ptBelongLineDict = computed<Record<number, Line[]|undefined>>(()=>{
        const res:Record<number, Line[]|undefined> = {}
        if(!save.value?.lines)
            return res
        for(const line of save.value.lines){
            const linePts = getMayRingLinePtIds(line)
            for(const ptId of linePts){
                const belong = res[ptId]
                if(belong)
                    belong.push(line)
                else
                    res[ptId] = [line]
            }
        }
        return res
    })
    const ptSizes = computed<Record<number, number[]|undefined>>(()=>{
        const res:Record<number, number[]> = {}
        if(!save.value?.points)
            return res
        for(const pt of save.value.points){
            const belongLines = ptBelongLineDict.value[pt.id] || []
            const sizes = belongLines
                .filter(x=>x.type===LineType.common)
                .map(x=>{
                    if(x.ptSize && x.ptSize>0){
                        return x.ptSize
                    }
                    const configMapped = readNumKeyedRecord(
                        configStore.config.lineWidthMapped, x.width||1)?.staSize
                    return configMapped || x.width || 1
                })
            res[pt.id] = sizes
        }
        return res
    })
    const ptSize = computed<Record<number, number|undefined>>(()=>{
        const res:Record<number, number> = {}
        Object.entries(ptSizes.value).forEach(kv=>{
            const [id, sizes] = kv
            if(sizes && sizes.length>0)
                res[Number(id)] = Math.max(...sizes)
            else
                res[Number(id)] = 1
        })
        return res
    })
    const ptNameSize = computed<Record<number, number|undefined>>(()=>{
        const res:Record<number, number> = {}
        if(!save.value?.points)
            return res
        for(const pt of save.value.points){
            let maxSize = 1
            const belongLines = ptBelongLineDict.value[pt.id] || []
            const sizes = belongLines
                .filter(x=>x.type===LineType.common)
                .map(x=>{
                    if(x.ptNameSize && x.ptNameSize>0){
                        return x.ptNameSize
                    }
                    const configMapped = readNumKeyedRecord(
                        configStore.config.lineWidthMapped, x.width||1)?.staNameSize
                    return configMapped || x.width || 1
                })
            if(sizes.length>0)
                maxSize = Math.max(...sizes)
            res[pt.id] = maxSize
        }
        return res
    })
    const ptRelatedLinks = computed<Record<number, ControlPointLink[]|undefined>>(()=>{
        const res:Record<number, ControlPointLink[]|undefined> = {}
        if(!save.value?.pointLinks)
            return res
        for(const link of save.value.pointLinks){
            for(const ptId of link.pts){
                if(!res[ptId])
                    res[ptId] = []
                res[ptId].push(link)
            } 
        }
        return res
    })
    const linesSortedByZIndex = computed(()=>{
        if(!save.value)
            return [];
        const copy = [...save.value.lines]
        keepOrderSort(copy, (x,y)=>(x.zIndex??0)-(y.zIndex??0))
        return copy
    })
    const lineChildren = computed<Record<number, Line[]|undefined>>(()=>{
        const res:Record<number, Line[]> = {}
        if(!save.value?.lines)
            return res
        for(const line of save.value.lines){
            const p = line.parent
            if(p){
                if(!res[p])
                    res[p] = []
                res[p].push(line)
            }
        }
        return res
    })

    function getNewId() {
        if(!save.value)
            throw Error("找不到存档")
        return save.value.idIncre++
    }
    function getPtById(id:number){
        return ptDict.value[id]
    }
    function getPtsByIds(ids:number[]){
        const res:ControlPoint[] = [];
        ids.forEach(id=>{
            const pt = ptDict.value[id]
            if(pt)
                res.push(pt)
        })
        return res;
    }
    function getLineById(lineId:number){
        return save.value?.lines.find(l=>l.id == lineId)
    }
    function getLinesByIds(lineIds:Set<number>){
        return save.value?.lines.filter(l=>lineIds.has(l.id)) || []
    }
    function getLineActualColor(line:Line) {
        if (line.colorPre) 
            return configStore.getPresetColor(line.colorPre)
        return line.color
    }
    function linesActualColorSame(lineA:Line, lineB:Line){
        if(!lineA.colorPre && !lineB.colorPre)
            return lineA.color === lineB.color
        return lineA.colorPre === lineB.colorPre
    }
    function getLineActualColorById(lineId:number){
        const line = getLineById(lineId)
        if(!line)
            return 'black'
        return getLineActualColor(line)
    }
    function adjacentSegs(ptId:number):LineSeg[]{
        const lines = save.value?.lines
        if(!lines)
            return [];
        const res:{line:Line, pts:ControlPoint[]}[] = []
        lines.forEach(line=>{
            const idx = line.pts.indexOf(ptId)
            if(idx===-1)
                return;
            const resHere:number[] = [];
            for(let i=-1; i<=1; i++){
                const idxi = idx + i
                if(idxi >= line.pts.length)
                    break;
                if(idxi >= 0){
                    resHere.push(line.pts[idxi])
                }
            }
            res.push({line, pts: getPtsByIds(resHere)})
        })
        return res;
    }
    function getLinesByPt(ptId:number){
        return ptBelongLineDict.value[ptId] || []
    }
    function getLinesDecidedPtSize(ptId:number){
        return ptSize.value[ptId] || 1
    }
    function getLinesDecidedPtSizes(ptId:number){
        return ptSizes.value[ptId]
    }
    function getLinesDecidedPtNameSize(ptId:number){
        return ptNameSize.value[ptId] || 1
    }
    function getLinesByType(lineType:LineType){
        if(!save.value)
            throw Error("找不到存档")
        return save.value.lines.filter(x=>x.type==lineType)
    }
    function getLinesByParent(parentLineId:number){
        return lineChildren.value[parentLineId]
    }
    function getNeighborByPt(ptId:number){
        const lines = getLinesByPt(ptId)
        const points = save.value?.points
        if(!lines)
            return []
        if(!points)
            return []
        const resIds:number[] = []
        lines.forEach(line=>{
            const idxs = indicesInArray(line.pts, ptId)
            idxs.forEach(idx=>{
                if(idx==-1)
                    return
                if(idx>0)
                    resIds.push(line.pts[idx-1])
                if(idx<line.pts.length-1)
                    resIds.push(line.pts[idx+1])
            })
        })
        return getPtsByIds(resIds)
    }
    function getPtsInRange(center:Coord, offset:number, exceptId?:number){
        if(!save.value)
            return []
        const left = center[0]-offset
        const right = center[0]+offset
        const top = center[1]-offset
        const bottom = center[1]+offset
        return save.value.points.filter(pt=>{
            const px = pt.pos[0];
            if(px<left || px>right)
                return false;
            const py = pt.pos[1];
            if(py<top || py>bottom)
                return false;
            return pt.id != exceptId
        })
    }
    function getTextTagById(textTagId:number){
        return save.value?.textTags.find(x=>x.id === textTagId)
    }
    function getPointLinksByPt(ptId:number){
        return ptRelatedLinks.value[ptId] || []
    }
    function insertNewPtToLine(lineId:number, afterIdx:number|'head'|'tail', pos:Coord, dir:ControlPointDir, sta:ControlPointSta){
        if(!save.value)
            return;
        const line = save.value.lines.find(x=>x.id == lineId)
        if(line){
            const id = getNewId()
            const newPt:ControlPoint = {
                id,
                pos,
                dir,
                sta
            }
            save.value.points.push(newPt)
            if(afterIdx==='head')
                afterIdx = -1
            else if(afterIdx==='tail')
                afterIdx = line.pts.length
            line.pts.splice(afterIdx+1, 0, id)
            return id;
        }
    }
    function insertPtToLine(ptId:number, lineId:number, afterIdx:number, pos:Coord, dir:ControlPointDir){
        if(!save.value)
            return;
        const line = save.value.lines.find(x=>x.id == lineId)
        const pt = save.value.points.find(x=>x.id == ptId)
        if(line && pt){
            pt.pos = pos
            pt.dir = dir
            if(isLineTypeWithoutSta(line.type)){
                pt.sta = ControlPointSta.plain
                pt.name = undefined
                pt.nameS = undefined
                pt.nameP = undefined
                disposedStaNameOf.value(pt.id)
            }
            line.pts.splice(afterIdx+1, 0, ptId)
        }
    }
    function createNewLine(newLine:Line){
        if(!save.value)
            throw Error('找不到存档')
        save.value.lines.push(newLine)
        ensureLinesOrdered()
    }
    function removePt(ptId:number){
        if(!save.value)
            return;
        const relatedLines = getLinesByPt(ptId);
        relatedLines.forEach(line=>{
            line.pts = line.pts.filter(pt=>pt!==ptId)
        })
        removePointLinkByPt(ptId)
        const idx = save.value.points.findIndex(x=>x.id == ptId)
        if(idx >= 0){
            save.value.points.splice(idx, 1)
            deletedPoint.value(ptId)
        }
        return relatedLines
    }
    function removePtFromLine(ptId:number, lineId:number){
        if(!save.value)
            return;
        const line = save.value.lines.find(x=>x.id == lineId)
        if(line)
            line.pts = line.pts.filter(pt=>pt!==ptId)
    }
    function removeNoLinePoints(){
        const noLinePoints:number[] = [];
        for(const pt of save.value?.points || []){
            if(isNamedPt(pt))
                continue
            const belongLines = ptBelongLineDict.value[pt.id]
            if(!belongLines || belongLines.length == 0)
                noLinePoints.push(pt.id)
        }
        noLinePoints.forEach(removePt)
    }
    function removePointLinkByPt(ptId:number){
        if(!save.value)
            return;
        const relatedLinks = ptRelatedLinks.value[ptId] || []
        relatedLinks.forEach(link=>{
            link.pts = link.pts.filter(pt=>pt!==ptId)
        })
        if(save.value.pointLinks)
            removeAllByPred(save.value.pointLinks, link=>link.pts.length<=1)
    }
    function removeDanglingPointLinks(){
        if(!save.value || !save.value.pointLinks)
            return;
        save.value.pointLinks = save.value.pointLinks.filter(link=>{
            const pts = getPtsByIds(link.pts)
            return pts.length>1
        })
    }
    function ensureLinesOrdered(ids?:number[]){
        if(!save.value)
            throw Error('找不到存档')
        keepOrderSort(save.value.lines, (a, b)=>{
            if(!!a.parent !== !!b.parent){
                //先把主线和支线分两块放
                //如果“是主线/支线”属性不一致则返回1/-1
                return (!!a.parent ? 1:0) - (!!b.parent ? 1:0)
            }
            if(ids){
                //如果指定了ids，那么按照ids的顺序排序
                const aIdx = ids.indexOf(a.id)
                const bIdx = ids.indexOf(b.id)
                if(aIdx>=0 && bIdx>=0)
                    return aIdx - bIdx
            }
            if(a.type !== b.type)
                return lineTypeOrderNum(a) - lineTypeOrderNum(b)
            if(a.group !== b.group){
                const agIdx = save.value?.lineGroups?.findIndex(g => g.id === a.group) ?? -1
                const bgIdx = save.value?.lineGroups?.findIndex(g => g.id === b.group) ?? -1
                return agIdx - bgIdx
            }
            return 0
        })
        //将支线按顺序放回其所属的主线底部
        const queue = [...save.value.lines]
        while(queue.length>0){
            const line = queue.shift()
            if(!line || line?.parent)
                continue
            const children = pullAllByPred(save.value.lines, x=>x.parent===line.id)
            if(children.length>0){
                const idx = save.value.lines.indexOf(line)
                save.value.lines.splice(idx+1, 0, ...children)
            }
        }
        console.log(save.value.lines.map(x=>x.name))
    }
    function arrangeLinesOfType(ids:number[], _lineType:LineType){
        ensureLinesOrdered(ids)
    }
    function tryMergePt(ptId:number){
        const thisPt = getPtById(ptId)
        if(!thisPt || !save.value){
            return;
        }
        const thatPt = save.value?.points.find(p => p.id!=thisPt.id && isSameCoord(thisPt.pos, p.pos))
        if(!thatPt){
            return
        }
        const thisLines = getLinesByPt(thisPt.id)
        const thatLines = getLinesByPt(thatPt.id)
        const thisLinesContainsNoneCommon = thisLines.some(x=>x.type!==LineType.common)
        const thatLinesContainsNoneCommon = thatLines.some(x=>x.type!==LineType.common)
        if(thisLinesContainsNoneCommon !== thatLinesContainsNoneCommon)
            return
        //本体保留名称更长的那个
        let keepThis  = (thisPt.name?.trim().length || 0) >= (thatPt?.name?.trim().length || 0)
        //方向保留线路更多的那个
        let keepThisDir = thisLines.length >= thatLines.length
        const finalDir = keepThisDir ? thisPt.dir : thatPt.dir

        let keepPt = keepThis ? thisPt : thatPt
        let delPt = keepThis ? thatPt : thisPt
        keepPt.dir = finalDir
        if(!keepPt.name?.trim()){
            //如果保留的那个没有名称，那么使用另一个的名称
            keepPt.name = delPt.name
            keepPt.nameS = delPt.nameS
            keepPt.nameP = delPt.nameP
        }
        let delFromLines = keepThis ? thatLines : thisLines
        delFromLines.forEach(line=>{
            const keepPtInLineIdx = line.pts.indexOf(keepPt.id)
            const needDelIdxs:number[] = []
            for(let i=0; i<line.pts.length; i++){
                if(line.pts[i] === delPt.id){
                    if(keepPtInLineIdx >= 0 && Math.abs(keepPtInLineIdx - i) === 1)
                        needDelIdxs.push(i)
                    line.pts[i] = keepPt.id
                }
            }
            removeAllByIndices(line.pts, needDelIdxs)
        })
        const delIdx = save.value.points.findIndex(x=>x.id == delPt.id)
        if(delIdx >= 0){
            save.value.points.splice(delIdx, 1)
            deletedPoint.value(delPt.id)
        }
        //把被删除的点的link转移到保留的点上
        const links = save.value.pointLinks?.filter(x=>x.pts.includes(delPt.id)) || []
        links.forEach(link=>{
            const idx = link.pts.indexOf(delPt.id)
            if(idx >= 0)
                link.pts[idx] = keepPt.id  
        })
        return {
            mutatedLines:delFromLines,
            mergedWithPt:thatPt,
            keptPt:keepPt,
            deldPt:delPt
        }
    }
    function isNamedPt(pt:ControlPoint){
        return !!pt.name?.trim()
    }
    function removeTextTag(id:number){
        const idx = save.value?.textTags.findIndex(x=>x.id===id)
        if(idx !== undefined && idx !== -1){
            save.value?.textTags.splice(idx, 1)
        }
    }
    function moveEverything(offset:Coord){
        if(!save.value?.points || !save.value?.textTags)
            throw Error('存档异常')
        for(const pt of save.value.points){
            pt.pos = coordAdd(pt.pos, offset)
        }
        for(const tag of save.value.textTags){
            tag.pos = coordAdd(tag.pos, offset)
        }
    }
    function setCvsSize(newSize:Coord){
        if(!save.value?.cvsSize)
            throw Error('存档异常')
        save.value.cvsSize = newSize
        ensureValidCvsSize(save.value)
    }

    const lineTypesRenderOrder = [
        LineType.terrain,
        LineType.common
    ]
    function lineTypeOrderNum(line: Line){
        return lineTypesRenderOrder.indexOf(line.type)
    }
    const lineTypesWithoutSta = [
        LineType.terrain
    ]
    function isLineTypeWithoutSta(lineType:LineType|LineType[]){
        if(typeof lineType === 'number')
            return lineTypesWithoutSta.includes(lineType)
        return lineType.some(t=>lineTypesWithoutSta.includes(t))
    }
    function isPtNoSta(ptId:number){
        for(const line of save.value?.lines||[]){
            if(line.pts.includes(ptId)){
                if(isLineTypeWithoutSta(line.type)){
                    return true
                }
            }
        }
        return false
    }
    function getStaCount(){
        if(save.value)
            return saveStaCount(save.value)
        return 0
    }
    function getLineCount(){
        if(save.value)
            return saveLineCount(save.value)
        return 0
    }
    const cvsWidth = computed<number>(()=>save.value?.cvsSize[0] || 1)
    const cvsHeight = computed<number>(()=>save.value?.cvsSize[1] || 1)
    const disposedStaNameOf = ref<(ptId:number)=>void>(()=>{})
    const deletedPoint = ref<(ptId:number)=>void>(()=>{})
    const deletedTextTag = ref<(ptId:number)=>void>(()=>{})

    watch(save, (newVal)=>{
        console.log('存档加载', newVal)
    })
    
    return { 
        save, getNewId, cvsWidth, cvsHeight, disposedStaNameOf, deletedPoint, deletedTextTag,
        getPtById, getPtsByIds, getLineById, getLinesByIds, linesSortedByZIndex,
        getLinesDecidedPtSize, getLinesDecidedPtSizes, getLinesDecidedPtNameSize,
        getLineActualColor, linesActualColorSame, getLineActualColorById,
        getNeighborByPt, getPtsInRange, adjacentSegs, getLinesByPt, getLinesByType, getLinesByParent, getTextTagById, getPointLinksByPt,
        insertNewPtToLine, insertPtToLine, createNewLine, arrangeLinesOfType, ensureLinesOrdered,
        removePt, removePtFromLine, removeNoLinePoints, removePointLinkByPt, removeDanglingPointLinks, tryMergePt, isNamedPt,
        removeTextTag, moveEverything, setCvsSize,
        isLineTypeWithoutSta, isPtNoSta,
        getLineCount, getStaCount
    }
})

export interface LineSeg{
    line:Line,
    pts:ControlPoint[]
}