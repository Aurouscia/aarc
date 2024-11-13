import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { ControlPoint, ControlPointDir, ControlPointSta, Line, Save } from "../save";
import { Coord } from "../coord";
import { isSameCoord } from "@/utils/sgn";

export const useSaveStore = defineStore('save', () => {
    //不应直接在此删除/添加车站/线路，应通过envStore进行，避免数据不一致
    const save = ref<Save>()
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
    function getNeighborByPt(ptId:number){
        const lines = save.value?.lines
        const points = save.value?.points
        if(!lines)
            return []
        if(!points)
            return []
        const resIds:number[] = []
        lines.forEach(line=>{
            const idx = line.pts.indexOf(ptId)
            if(idx==-1)
                return
            if(idx>0){
                resIds.push(line.pts[idx-1])
            }
            if(idx<line.pts.length-1){
                resIds.push(line.pts[idx+1])
            }
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
    function insertPtOnLine(lineId:number, afterIdx:number, pos:Coord, dir:ControlPointDir){
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
            line.pts.splice(afterIdx+1, 0, ptId)
        }
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
            keepThis = (thisPt.name?.length || 0) > (thatPt?.name?.length || 0)
        }else{
            keepThis = thisLines.length > thatLines.length
        }
        let keepPt = keepThis ? thisPt : thatPt
        let delPt = keepThis ? thatPt : thisPt
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
        }
        return {
            mutatedLines:delFromLines,
            mergedByPt:keepPt
        }
    }

    function isNamedPt(pt:ControlPoint){
        return !!pt.name?.trim()
    }
    const cvsWidth = computed<number>(()=>save.value?.cvsSize[0] || 1)
    const cvsHeight = computed<number>(()=>save.value?.cvsSize[1] || 1)
    return { 
        save, getNewId, cvsWidth, cvsHeight,
        getPtById, getPtsByIds, getLineById, getNeighborByPt, getPtsInRange, adjacentSegs, getLinesByPt,
        insertPtOnLine, insertPtToLine, removePt, removePtFromLine, tryMergePt,
        isNamedPt
    }
})

export interface LineSeg{
    line:Line,
    pts:ControlPoint[]
}