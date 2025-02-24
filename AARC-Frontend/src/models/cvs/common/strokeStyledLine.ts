import { LineStyle } from "@/models/save"
import { CvsContext } from "./cvsContext"

export function strokeStyledLine(
        ctx:CanvasRenderingContext2D|CvsContext,
        lineStyle:LineStyle,
        lineWidthBase:number,
        dynaColor:string,
    ){
    ctx.lineWidth = lineWidthBase
    ctx.globalAlpha = 1
    ctx.strokeStyle = dynaColor
    ctx.setLineDash([])
    ctx.lineCap = 'butt'
    ctx.stroke()
    for(let i=lineStyle.layers.length-1; i>=0; i--){
        const layer = lineStyle.layers[i]
        const layerWidth = lineWidthBase * (layer.width||1)
        ctx.lineWidth = layerWidth
        ctx.globalAlpha = layer.opacity || 1
        if(layer.colorMode==='line')
            ctx.strokeStyle = dynaColor
        else
            ctx.strokeStyle = layer.color || 'white'
        const dashNums = parseDash(layer.dash)
        for(let i=0;i<dashNums.length;i++){
            dashNums[i] = dashNums[i]*lineWidthBase
        }
        ctx.setLineDash(dashNums)
        ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.globalAlpha = 1
}
function parseDash(dashStr?:string):number[]{
    const res:number[] = []
    if(!dashStr)
        return res
    const parts = dashStr.split(' ')
    for(const p of parts){
        const pNum = parseFloat(p)
        if(!isNaN(pNum))
            res.push(pNum)
    }
    return res
}