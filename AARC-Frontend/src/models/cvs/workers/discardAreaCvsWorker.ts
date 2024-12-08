import { useDiscardAreaStore } from "@/models/stores/discardAreaStore";
import { defineStore } from "pinia";

export const useDiscardAreaCvsWorker = defineStore('discardAreaCvsWorker',()=>{
    const discardAreaStore = useDiscardAreaStore()
    function renderDiscardArea(ctx:CanvasRenderingContext2D){
        if(!discardAreaStore.discarding)
            return
        const pts = discardAreaStore.getDiscardAreaPolyPts()
        if(pts.length<3)
            return
        ctx.beginPath()
        ctx.fillStyle = '#ff0000'
        ctx.globalAlpha = 0.5
        ctx.moveTo(...pts[0])
        for(let i=1; i<pts.length; i++){
            ctx.lineTo(...pts[i])
        }
        ctx.fill()
        ctx.globalAlpha = 1
    }
    return { renderDiscardArea }
})