import { defineStore } from "pinia";
import { ref } from "vue";
import { ControlPoint, Line, Save } from "../save";

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

    return { save, getNewId, getPtsByIds, adjacentSegs }
})

export interface LineSeg{
    line:Line,
    pts:ControlPoint[]
}