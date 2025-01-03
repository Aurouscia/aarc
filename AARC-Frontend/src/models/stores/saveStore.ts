import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { ControlPoint, ControlPointDir, ControlPointSta, ensureValidCvsSize, Line, LineType, Save } from "../save";
import { Coord } from "../coord";
import { isSameCoord } from "@/utils/sgn";
import { getRangeByPred } from "@/utils/lang/getRangeByPred";
import { checkOrder } from "@/utils/lang/checkOrder";
import { useConfigStore } from "./configStore";
import { indicesInArray } from "@/utils/lang/indicesInArray";
import { coordAdd } from "@/utils/coordUtils/coordMath";

export const useSaveStore = defineStore('save', () => {
    //不应直接在此删除/添加车站/线路，应通过envStore进行，避免数据不一致
    const save = ref<Save>()
    const configStore = useConfigStore()

    function getNewId() {
        if(!save.value)
            throw Error("找不到存档")
        const current = save.value.idIncre;
        save.value.idIncre += 1
        return current
    }
    function getPtById(id:number){
        return save.value?.points.find(x=>x.id==id);
    }
    function getPtsByIds(ids:number[]){
        const res:ControlPoint[] = [];
        ids.forEach(id=>{
            const pt = save.value?.points.find(x=>x.id == id)
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
        const lines = save.value?.lines
        if(!lines)
            return []
        return lines.filter(line=>line.pts.includes(ptId))
    }
    function getLinesByType(lineType:LineType){
        if(!save.value)
            throw Error("找不到存档")
        return save.value.lines.filter(x=>x.type==lineType)
    }
    function getNeighborByPt(ptId:number){
        const lines = save.value?.lines
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
        const res:ControlPoint[] = []
        resIds.forEach(id=>{
            const pt = points.find(pt=>pt.id == id)
            if(pt){
                res.push(pt)
            }
        })
        return res
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
        let keepThis = true
        if(thisLines.length == thatLines.length){
            keepThis = (thisPt.name?.trim().length || 0) > (thatPt?.name?.trim().length || 0)
        }else{
            keepThis = thisLines.length > thatLines.length
        }
        let keepPt = keepThis ? thisPt : thatPt
        let delPt = keepThis ? thatPt : thisPt
        if(!keepPt.name?.trim() && !keepPt.nameS?.trim()){
            keepPt.name = delPt.name
            keepPt.nameS = delPt.nameS
            keepPt.nameP = delPt.nameP
        }
        let delFromLines = keepThis ? thatLines : thisLines
        delFromLines.forEach(line=>{
            for(let i=0; i<line.pts.length; i++){
                if(line.pts[i] === delPt.id){
                    line.pts[i] = keepPt.id
                }
            }
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
    const cvsWidth = computed<number>(()=>save.value?.cvsSize[0] || 1)
    const cvsHeight = computed<number>(()=>save.value?.cvsSize[1] || 1)
    const disposedStaNameOf = ref<(ptId:number)=>void>(()=>{})
    const deletedPoint = ref<(ptId:number)=>void>(()=>{})

    watch(save, (newVal)=>{
        console.log('存档加载', newVal)
    })
    
    return { 
        save, getNewId, cvsWidth, cvsHeight, disposedStaNameOf, deletedPoint,
        getPtById, getPtsByIds, getLineById, getLinesByIds, getLineActualColor, linesActualColorSame, getLineActualColorById,
        getNeighborByPt, getPtsInRange, adjacentSegs, getLinesByPt, getLinesByType,
        insertNewPtToLine, insertPtToLine, createNewLine, removePt, removePtFromLine, arrangeLinesOfType, tryMergePt, isNamedPt,
        removeTextTag, moveEverything, setCvsSize,
        isLineTypeWithoutSta, isPtNoSta
    }
})

export interface LineSeg{
    line:Line,
    pts:ControlPoint[]
}