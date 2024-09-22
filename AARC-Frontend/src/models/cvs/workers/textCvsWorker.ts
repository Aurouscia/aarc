import { ControlPoint } from "@/models/save";
import { useSaveStore } from "@/models/stores/saveStore";
import { staNameColor, staNameFontR, staNameLineHeightR, staNameSubColor, staNameSubFontR, staNameSubLineHeightR } from "@/utils/consts";
import { sgn } from "@/utils/sgn";

export function useTextCvsWorker(){
    const saveStore = useSaveStore()
    function renderAllPtName(ctx:CanvasRenderingContext2D){
        if(!saveStore.save)
            return;
        const pts = saveStore.save.points;
        pts.forEach(pt=>{
            renderPtName(ctx, pt)
        })
    }
    function renderPtName(ctx:CanvasRenderingContext2D, pt:ControlPoint){
        if(!pt.nameP)
            return;
        const x = pt.pos[0]+pt.nameP[0]
        const y = pt.pos[1]+pt.nameP[1]
        const xSgn = sgn(pt.nameP[0])
        const ySgn = sgn(pt.nameP[1])
        if(xSgn==-1)
            ctx.textAlign = 'right'
        else if(xSgn==0)
            ctx.textAlign = 'center'
        else
            ctx.textAlign = 'left'

        const nameLines = pt.name?.split('\n') || []
        const nameHeight = nameLines.length * staNameLineHeightR
        const nameSubLines = pt.nameS?.split('\n') || []
        const nameSubHeight = nameSubLines.length * staNameSubLineHeightR
        const totalHeight = nameHeight+nameSubHeight
        ctx.textBaseline = 'middle'
        ctx.fillStyle = staNameColor
        ctx.font = staNameFontR;
        for(let i=0; i<nameLines.length; i++){
            const yFromTop = (i + 0.5) * staNameLineHeightR
            let ty = y + yFromTop
            if(ySgn == -1){
                ty -= totalHeight
            }else if(ySgn == 0){
                ty -= totalHeight/2
            }
            ctx.fillText(nameLines[i], x, ty)
        }
        ctx.fillStyle = staNameSubColor
        ctx.font = staNameSubFontR
        for(let i=0; i<nameSubLines.length; i++){
            const yFromTop = (i + 0.5) * staNameSubLineHeightR + nameHeight
            let ty = y + yFromTop
            if(ySgn == -1){
                ty -= totalHeight
            }else if(ySgn == 0){
                ty -= totalHeight/2
            }
            ctx.fillText(nameSubLines[i], x, ty)
        }
    }
    return { renderAllPtName }
}