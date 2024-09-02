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

    return { 
        save, getNewId,
        getPtsByIds, adjacentSegs, getLinesByPt,
        insertPtOnLine
    }
})

export interface LineSeg{
    line:Line,
    pts:ControlPoint[]
}