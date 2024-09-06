import { defineStore } from "pinia";
import { ref } from "vue";
import { ControlPoint, ControlPointDir, ControlPointSta, Line, Save } from "../save";
import { Coord } from "../coord";

export const useSaveStore = defineStore('save', () => {
    const save = ref<Save>()
    function getNewId() {
        if(!save.value)
            throw Error("找不到存档")
        const current = save.value.idIncre;
        save.value.idIncre += 1
        return current
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
    return { 
        save, getNewId,
        getPtsByIds, getNeighborByPt, adjacentSegs, getLinesByPt,
        insertPtOnLine, insertPtToLine, removePt, removePtFromLine
    }
})

export interface LineSeg{
    line:Line,
    pts:ControlPoint[]
}