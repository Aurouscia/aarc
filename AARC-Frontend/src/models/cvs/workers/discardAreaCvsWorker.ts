import { useDiscardAreaStore } from "@/models/stores/discardAreaStore";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";

export const useDiscardAreaCvsWorker = defineStore('discardAreaCvsWorker',()=>{
    const discardAreaStore = useDiscardAreaStore()
    function renderDiscardArea(ctx:CvsContext){
        const status = discardAreaStore.discarding
        if(status == 'no')
            return
        const {poly, origin, size} = discardAreaStore.getDiscardAreaInfo()
        if(poly.length<3)
            return
        ctx.beginPath()
        ctx.fillStyle = status == 'active' ? '#ff0000' : '#ffcccc'
        ctx.globalAlpha = 0.5
        ctx.moveTo(...poly[0])
        for(let i=1; i<poly.length; i++){
            ctx.lineTo(...poly[i])
        }
        ctx.fill()
        ctx.globalAlpha = 1

        const [ox, oy] = origin
        const fontSize = size/6
        const margin = size/12
        ctx.font = {font:'microsoft YaHei', fontSize}
        ctx.fillStyle = 'red'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText('拖到此处', ox+margin, oy+margin)
        ctx.fillText('删除', ox+margin, oy+fontSize + margin*2)
    }
    return { renderDiscardArea }
})