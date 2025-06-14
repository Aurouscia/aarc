import { RectCoord } from "@/models/coord"
import { CvsContext } from "@/models/cvs/common/cvsContext"

export function drawRect(ctx:CvsContext, rect:RectCoord, strokeColor?:string, lineWidth?:number){
    const [x, y] = rect[0]
    const [xr, yb] = rect[1]
    const w = xr - x
    const h = yb - y
    ctx.strokeStyle = strokeColor ?? 'black'
    ctx.lineWidth = lineWidth ?? 1.5
    ctx.strokeRect(x, y, w, h)
}