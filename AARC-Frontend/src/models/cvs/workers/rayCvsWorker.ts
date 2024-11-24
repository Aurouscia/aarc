import { Coord } from "@/models/coord";
import { useEnvStore } from "@/models/stores/envStore";
import { defineStore } from "pinia";

export const useRayCvsWorker = defineStore('rayCvsWorker', ()=>{
    const { getDisplayRatio } = useEnvStore()
    function renderRay(ctx:CanvasRenderingContext2D, from:Coord, way:Coord){
        ctx.lineWidth = 2 * getDisplayRatio()
        ctx.strokeStyle = 'green'
        ctx.beginPath()
        ctx.moveTo(from[0], from[1])
        ctx.lineTo(from[0]+way[0]*10000, from[1]+way[1]*10000)
        ctx.stroke()
    }
    return { renderRay }
})