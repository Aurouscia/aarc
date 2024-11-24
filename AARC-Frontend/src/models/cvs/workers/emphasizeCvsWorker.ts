import { Coord } from "@/models/coord";
import { Line } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { isRing } from "@/utils/lineUtils/isRing";
import { defineStore } from "pinia";

export const useEmphasizeCvsWorker = defineStore('emphasizeCvsWorker', ()=>{
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    function renderEmphasizesForRingLines(ctx:CanvasRenderingContext2D, range:Line[]){
        const coords:Coord[] = []
        saveStore.save?.lines.forEach(line=>{
            if(!range.some(r=>r.id===line.id))
                return
            if(isRing(line)){
                const pt = saveStore.getPtById(line.pts[0])
                if(pt)
                    coords.push(pt?.pos)
            }
        })
        const radius = cs.config.ptStaSize*2
        coords.forEach(coord=>{
            renderEmphasizeSingle(ctx, coord, radius)
        })
    }
    function renderEmphasizeSingle(ctx:CanvasRenderingContext2D, coord:Coord, radius:number){
        ctx.beginPath()
        ctx.arc(...coord, radius, 0, 2*Math.PI)
        ctx.strokeStyle = 'red'
        ctx.lineWidth = 5
        ctx.stroke()
    }
    return { renderEmphasizesForRingLines }
})