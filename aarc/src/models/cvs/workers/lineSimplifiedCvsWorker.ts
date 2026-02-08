import { Coord, FormalPt } from "@/models/coord";
import { useFormalizedLineStore } from "@/models/stores/saveDerived/formalizedLineStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { Line, LineType } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { keepOrderSort } from "@/utils/lang/keepOrderSort";
import { useLineStateStore } from "@/models/stores/saveDerived/state/lineStateStore";

export const useLineSimplifiedCvsWorker = defineStore('lineSimplifiedCvsWorker', ()=>{
    const saveStore = useSaveStore()
    const lineStateStore = useLineStateStore()
    const cs = useConfigStore()
    const formalizedLineStore = useFormalizedLineStore()
    function renderAllLines(ctx:CvsContext, lineWidth:number){
        const render = (lineInfo:Line, pts:FormalPt[])=>{
            if(!lineInfo)
                return
            const poss = pts.map(x=>x.pos)
            let lineWidthHere = lineWidth
            if(lineInfo.type === LineType.terrain){
                const originalWidth = cs.config.lineWidth * (lineInfo.width||1)
                lineWidthHere = Math.max(lineWidth, originalWidth)
            }
            renderLine(ctx, lineInfo, poss, lineWidthHere)
        }
        const formalizedLines:{lineId:number, pts:FormalPt[]}[] = []
        formalizedLineStore.enumerateFormalizedLines((lineId, pts)=>{
            formalizedLines.push({lineId, pts})
        })
        const targets:{lineInfo:Line, pts:FormalPt[]}[] = []
        //按照saveStore.linesSortedByZIndex的顺序渲染（这个顺序一直都是对的）
        saveStore.linesSortedByZIndex.forEach(line=>{
            const pts = formalizedLines.find(x=>x.lineId === line.id)?.pts
            //isFake的线不绘入略缩图
            if(pts && !line.isFake)
                targets.push({lineInfo:line, pts}) 
        })
        keepOrderSort(targets, (a,b)=>b.lineInfo.type-a.lineInfo.type)
        for(const target of targets){
            render(target.lineInfo, target.pts)
        }
    }
    function renderLine(ctx:CvsContext, lineInfo:Line, pts:Coord[], lineWidth:number){
        if(pts.length<=1)
            return
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = lineWidth
        const color = lineStateStore.getLineActualColor(lineInfo)
        ctx.strokeStyle = color
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(...pts[0])
        for(let i=1;i<pts.length;i++){
            ctx.lineTo(...pts[i])
        }
        if(lineInfo.isFilled){
            ctx.fill()
        }else{
            ctx.stroke()
        }
    }
    return {
        renderAllLines
    }
})