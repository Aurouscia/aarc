import { Coord, FormalPt } from "@/models/coord";
import { useFormalizedLineStore } from "@/models/stores/saveDerived/formalizedLineStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { Line, LineType } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";

export const useLineSimplifiedCvsWorker = defineStore('lineSimplifiedCvsWorker', ()=>{
    const saveStore = useSaveStore()
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
        const targets:{lineInfo:Line, pts:FormalPt[]}[] = []
        formalizedLineStore.enumerateFormalizedLines((lineId, pts)=>{
            const lineInfo = saveStore.getLineById(lineId)
            if(lineInfo)
                targets.push({lineInfo, pts})
        })
        targets.sort((x,y)=>{
            const xIsTerrain = x.lineInfo.type === LineType.terrain ? 1:0
            const yIsTerrain = y.lineInfo.type === LineType.terrain ? 1:0
            return yIsTerrain - xIsTerrain
        })
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
        const color = saveStore.getLineActualColor(lineInfo)
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