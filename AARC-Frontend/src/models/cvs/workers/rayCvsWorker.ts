import { Coord } from "@/models/coord";

export function useRayCvsWorker(){
    function renderRay(ctx:CanvasRenderingContext2D, from:Coord, way:Coord){
        ctx.lineWidth = 2
        ctx.strokeStyle = 'green'
        ctx.beginPath()
        ctx.moveTo(from[0], from[1])
        ctx.lineTo(from[0]+way[0]*10000, from[1]+way[1]*10000)
        ctx.stroke()
    }
    return { renderRay }
}