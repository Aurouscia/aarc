import { Coord, RectCoord, SgnCoord } from "@/models/coord"

export interface DrawTextBodyOption{
    text?:string
    color:string
    fontStr:string
    rowHeight:number
}
export interface DrawTextStrokeOption{
    width:number
    color:string
    opacity:number
}
export function drawText(
    ctx:CanvasRenderingContext2D, pos:Coord, align:SgnCoord,
    main:DrawTextBodyOption, sub:DrawTextBodyOption, stroke?:DrawTextStrokeOption|false, task:'draw'|'measure'|'both' = 'both'): RectCoord|undefined
{
    const [x, y] = pos
    const [xSgn, ySgn] = align

    ctx.textBaseline = 'middle'
    const mainLines = main.text?.split('\n').map(x=>x.trim()) || []
    const mainHeight = mainLines.length * main.rowHeight
    const subLines = sub.text?.split('\n').map(x=>x.trim()) || []
    const subHeight = subLines.length * sub.rowHeight
    const totalHeight = mainHeight+subHeight

    if(xSgn==-1)
        ctx.textAlign = 'right'
    else if(xSgn==0)
        ctx.textAlign = 'center'
    else
        ctx.textAlign = 'left'
    let yTop = y;
    if(ySgn == -1){
        yTop -= totalHeight
    }else if(ySgn == 0){
        yTop -= totalHeight/2
    }

    const enumerateMainLines = (fn:(text:string, ty:number)=>void)=>{
        for(let i=0; i<mainLines.length; i++){
            const text = mainLines[i]
            const yFromTop = (i + 0.5) * main.rowHeight
            let ty = yTop + yFromTop
            fn(text, ty)
        }
    }
    const enumerateSubLines = (fn:(text:string, ty:number)=>void)=>{
        for(let i=0; i<subLines.length; i++){
            const text = subLines[i]
            const yFromTop = (i + 0.5) * sub.rowHeight + mainHeight
            let ty = yTop + yFromTop
            fn(text, ty)
        }
    }

    const needDraw = task === 'draw' || task === 'both'
    const needMeasure = task === 'measure' || task === 'both'

    if(stroke && needDraw){
        ctx.strokeStyle = stroke.color
        ctx.globalAlpha = stroke.opacity
        ctx.lineWidth = stroke.width
        ctx.lineJoin = 'round'
        ctx.font = main.fontStr
        enumerateMainLines((text, ty)=>{
            ctx.strokeText(text, x, ty)
        })
        ctx.font = sub.fontStr
        enumerateSubLines((text, ty)=>{
            ctx.strokeText(text, x, ty)
        })
        ctx.globalAlpha = 1
    }

    let biggestWidth = 0
    ctx.fillStyle = main.color
    ctx.font = main.fontStr
    enumerateMainLines((text, ty)=>{
        if(needDraw)
            ctx.fillText(text, x, ty)
        if(needMeasure){
            const width = ctx.measureText(text).width
            if(width > biggestWidth){
                biggestWidth = width
            }
        }
    })

    ctx.fillStyle = sub.color
    ctx.font = sub.fontStr
    enumerateSubLines((text, ty)=>{
        if(needDraw)
            ctx.fillText(text, x, ty)
        if(needMeasure){
            const width = ctx.measureText(text).width
            if(width > biggestWidth){
                biggestWidth = width
            }
        }
    })

    if(needMeasure){
        let leftMost = x;
        let rightMost = x;
        if(xSgn == -1){
            leftMost -= biggestWidth
        }
        else if(xSgn == 0){
            leftMost -= biggestWidth/2
            rightMost += biggestWidth/2
        }else{
            rightMost += biggestWidth
        }
        const leftUpper:Coord = [leftMost, yTop]
        const rightLower:Coord = [rightMost, yTop+totalHeight]
        const rect:RectCoord = [leftUpper, rightLower]
        return rect
    }
}