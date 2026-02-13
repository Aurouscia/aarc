import { LineStyle } from "@/models/save"
import { CvsContext } from "./cvsContext"
import { usePatternStore } from "@/models/stores/patternStore"
import { Coord } from "@/models/coord"

export function strokeStyledLine(
    ctx: CanvasRenderingContext2D|CvsContext,
    options: {
        scale?:number,
        offset?:Coord,
        lineStyle:LineStyle,
        lineWidthBase:number,
        dynaColor:string,
        fixedColorConverter:(c:string)=>string
    }){
    const { scale, offset, lineWidthBase, lineStyle, dynaColor, fixedColorConverter } = options
    ctx.lineWidth = lineWidthBase
    ctx.globalAlpha = 1
    ctx.strokeStyle = dynaColor
    ctx.setLineDash([])
    ctx.lineCap = 'butt'
    ctx.stroke()
    for(let i = lineStyle.layers.length - 1; i >= 0; i--){
        const layer = lineStyle.layers[i]
        //被input设置的width和opacity是字符串形式的数字，此处应该使用双等号判断是否为0，三等号判断将始终为false
        if(!layer.width || layer.width==0){
            continue
        }
        if(!layer.opacity || layer.opacity==0){
            continue
        }
        ctx.lineWidth = lineWidthBase * layer.width
        ctx.globalAlpha = layer.opacity
        let color
        if(layer.colorMode === 'line')
            color = dynaColor
        else {
            if(layer.color){
                color = fixedColorConverter(layer.color)
            } else {
                color = 'white'
            }
        }

        ctx.strokeStyle = color

        if(layer.dash){
            const dashNums = parseDash(layer.dash)
            for(let i=0;i<dashNums.length;i++){
                dashNums[i] = dashNums[i]*lineWidthBase
            }
            ctx.setLineDash(dashNums)
            ctx.lineCap = layer.dashCap || 'butt'
        }
        else if(layer.pattern){
            console.log(offset, scale)
            const patternBase = usePatternStore().getRendered(layer.pattern, scale ?? 1, color, 1)
            if(patternBase){
                const pattern = ctx.createPattern(patternBase, null)
                if(pattern){
                    ctx.strokeStyle = pattern
                }
            }
        }

        ctx.stroke()
    }
    //容易忘记初始化的属性必须复位
    ctx.setLineDash([])
    ctx.globalAlpha = 1
    ctx.lineCap = 'butt'
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