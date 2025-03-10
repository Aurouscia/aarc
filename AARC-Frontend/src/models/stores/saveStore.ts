import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { ControlPoint, ControlPointDir, ControlPointSta, ensureValidCvsSize, Line, LineType, Save, saveLineCount, saveStaCount } from "../save";
import { Coord } from "../coord";
import { isSameCoord } from "@/utils/sgn";
import { getRangeByPred } from "@/utils/lang/getRangeByPred";
import { checkOrder } from "@/utils/lang/checkOrder";
import { useConfigStore } from "./configStore";
import { indicesInArray, removeAllByIndices } from "@/utils/lang/indicesInArray";
import { coordAdd } from "@/utils/coordUtils/coordMath";
import { getMayRingLinePtIds } from "@/utils/lineUtils/isRing";
import { readNumKeyedRecord } from "@/utils/lang/readNumKeyedRecord";

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
    const ptSize = computed<Record<number, number|undefined>>(()=>{
        const res:Record<number, number> = {}
        if(!save.value?.points)
            return res
        for(const pt of save.value.points){
            let maxSize = 1
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
            if(sizes.length>0)
                maxSize = Math.max(...sizes)
            res[pt.id] = maxSize
        }
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

    function getNewId() {
        if(!save.value)
            throw Error("找不到存档")
        const current = save.value.idIncre;
        save.value.idIncre += 1
        return current
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
    function getLinesDecidedPtNameSize(ptId:number){
        return ptNameSize.value[ptId] || 1
    }
    function getLinesByType(lineType:LineType){
        if(!save.value)
            throw Error("找不到存档")
        return save.value.lines.filter(x=>x.type==lineType)
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
    function insertNewPtToLine(lineId:number, afterIdx:number|'head'|'tail', pos:Coord, dir:ControlPointDir){
        if(!save.value)
            return;
        const line = save.value.lines.find(x=>x.id == lineId)
        if(line){
            const id = getNewId()
            const newPt:ControlPoint = {
                id,
                pos,
                dir,
                sta: ControlPointSta.sta
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
        ensureLinesOrderedByType()
        console.log(save.value.lines)
        const newTypeOrderNum = lineTypeOrderNum(newLine)
        const firstBiggerIdx = save.value.lines.findIndex(x=>lineTypeOrderNum(x) > newTypeOrderNum)
        if(firstBiggerIdx==-1)
            save.value.lines.push(newLine)
        else
            save.value.lines.splice(firstBiggerIdx, 0, newLine)
    }
    function removePt(ptId:number){
        if(!save.value)
            return;
        const relatedLines = getLinesByPt(ptId);
        relatedLines.forEach(line=>{
            line.pts = line.pts.filter(pt=>pt!==ptId)
        })
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
    function ensureLinesOrderedByType(){
        if(!save.value)
            throw Error('找不到存档')
        const ok = checkOrder(save.value.lines, 'asc', lineTypeOrderNum)
        if(ok)
            return
        console.warn('线路类型顺序异常，正在修复')
        const newList:Line[] = []
        lineTypesRenderOrder.forEach(type=>{
            newList.push(...getLinesByType(type))
        })
        save.value.lines.splice(0, save.value.lines.length, ...newList)
    }
    function arrangeLinesOfType(ids:number[], lineType:LineType){
        ensureLinesOrderedByType()
        if(!save.value)
            throw Error('找不到存档')
        const range = getRangeByPred(save.value.lines, (line)=>line.type==lineType)
        if(!range){
            throw Error('排序设定：不存在该类型线路')
        }
        const rangeLength = range.last - range.first+1
        if(rangeLength != ids.length)
            throw Error('排序设定：该类型线路个数与排序指令参数长度不一致')
        const temp:Line[] = []
        ids.forEach(id=>{
            const line = getLineById(id)
            if(!line)
                throw Error('排序设定：找不到指定线路')
            temp.push(line)
        })
        save.value.lines.splice(range.first, rangeLength, ...temp)
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
        getPtById, getPtsByIds, getLineById, getLinesByIds, getLinesDecidedPtSize, getLinesDecidedPtNameSize,
        getLineActualColor, linesActualColorSame, getLineActualColorById,
        getNeighborByPt, getPtsInRange, adjacentSegs, getLinesByPt, getLinesByType, getTextTagById,
        insertNewPtToLine, insertPtToLine, createNewLine, arrangeLinesOfType,
        removePt, removePtFromLine, removeNoLinePoints, tryMergePt, isNamedPt,
        removeTextTag, moveEverything, setCvsSize,
        isLineTypeWithoutSta, isPtNoSta,
        getLineCount, getStaCount
    }
})

export interface LineSeg{
    line:Line,
    pts:ControlPoint[]
}