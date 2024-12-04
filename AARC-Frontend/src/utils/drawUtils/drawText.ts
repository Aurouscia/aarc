import { Coord, RectCoord, SgnCoord, SgnNumber } from "@/models/coord"
import { concatFontStr } from "../lang/fontStr"

export interface DrawTextBodyOption{
    text?:string
    color:string
    font:string
    fontSize:number
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

    ctx.textAlign = getTextAlign(xSgn)
    const rowMargin = main.rowHeight - main.fontSize
    const yTop = getYTop(y, ySgn, totalHeight, rowMargin)

    const mainMeasures:ActualBaselineResult[] = []
    const subMeasures:ActualBaselineResult[] = []
    const enumerateMainLines = (fn:(text:string, ty:number, idx:number)=>void)=>{
        for(let i=0; i<mainLines.length; i++){
            const text = mainLines[i]
            const yFromTop = (i + 0.5) * main.rowHeight
            if(!mainMeasures[i]){
                const baseline = getTextActualCenterBaseline(ctx, yTop+yFromTop, text)
                mainMeasures[i] = baseline
            }
            const shouldUseY = mainMeasures[i].shouldUseY
            fn(text, shouldUseY, i)
        }
    }
    const enumerateSubLines = (fn:(text:string, ty:number, idx:number)=>void)=>{
        for(let i=0; i<subLines.length; i++){
            const text = subLines[i]
            const yFromTop = (i + 0.5) * sub.rowHeight + mainHeight
            if(!subMeasures[i]){
                const baseline = getTextActualCenterBaseline(ctx, yTop+yFromTop, text)
                subMeasures[i] = baseline
            }
            const shouldUseY = subMeasures[i].shouldUseY
            fn(text, shouldUseY, i)
        }
    }

    const needDraw = task === 'draw' || task === 'both'
    const needMeasure = task === 'measure' || task === 'both'
    const mainFontStr = concatFontStr(main.font, main.fontSize)
    const subFontStr = concatFontStr(sub.font, sub.fontSize)

    if(stroke && needDraw){
        ctx.strokeStyle = stroke.color
        ctx.globalAlpha = stroke.opacity
        ctx.lineWidth = stroke.width
        ctx.lineJoin = 'round'
        ctx.font = mainFontStr
        enumerateMainLines((text, ty)=>{
            ctx.strokeText(text, x, ty)
        })
        ctx.font = subFontStr
        enumerateSubLines((text, ty)=>{
            ctx.strokeText(text, x, ty)
        })
        ctx.globalAlpha = 1
    }

    let biggestWidth = 0
    ctx.fillStyle = main.color
    ctx.font = mainFontStr
    enumerateMainLines((text, ty, idx)=>{
        if(needDraw)
            ctx.fillText(text, x, ty)
        if(needMeasure){
            const width = mainMeasures[idx].m.width
            if(width > biggestWidth){
                biggestWidth = width
            }
        }
    })

    ctx.fillStyle = sub.color
    ctx.font = subFontStr
    enumerateSubLines((text, ty, idx)=>{
        if(needDraw)
            ctx.fillText(text, x, ty)
        if(needMeasure){
            const width = subMeasures[idx].m.width
            if(width > biggestWidth){
                biggestWidth = width
            }
        }
    })

    if(needMeasure){
        return getRect(x, y, xSgn, ySgn, biggestWidth, totalHeight)
    }
}

const chineseStyleDropCapPattern = /^[0-9a-zA-Z]{1,2}(?=\s{0,1}号?线$)/
export function drawTextForLineName(
    ctx:CanvasRenderingContext2D, pos:Coord, align:SgnCoord,
    main:DrawTextBodyOption, sub:DrawTextBodyOption, stroke?:DrawTextStrokeOption|false, task:'draw'|'measure'|'both' = 'both'):
    {isDropCap:boolean, rect:RectCoord|undefined}|undefined
{
    const mainText = main.text?.trim() || ''
    const subText = sub.text?.trim() || ''
    const match = chineseStyleDropCapPattern.exec(mainText)
    if(!match || match.length===0)
    {
        //如果不是需要dropCap的线路名，则fallback到一般的写法
        return {isDropCap:false, rect:drawText(ctx, pos, align, main, sub, stroke, task)}
    }
    const needDraw = task === 'draw' || task === 'both'
    const needMeasure = task === 'measure' || task === 'both'
    const totalHeight = main.rowHeight + sub.rowHeight

    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left' //如果是dropCap线路名，textAlign无视参数，参数仅用来控制矩形相对坐标的位置
    const [x, y] = pos
    const [xSgn, ySgn] = align
    const yTop = getYTop(y, ySgn, totalHeight)

    const lineNum = match[0]
    const restPart = mainText.substring(lineNum.length).trim()
    const fontPadding = (main.rowHeight - main.fontSize + sub.rowHeight - sub.fontSize)
    const giantFontSize = main.fontSize + sub.fontSize + fontPadding
    const giantTextRowHeight = main.rowHeight + sub.rowHeight
    ctx.fillStyle = main.color
    const giantFontStr = concatFontStr(main.font, giantFontSize)
    const mainFontStr = concatFontStr(main.font, main.fontSize)
    const subFontStr = concatFontStr(sub.font, sub.fontSize)
    ctx.font = giantFontStr
    const giantBaseline = getTextActualCenterBaseline(ctx, yTop+giantTextRowHeight/2, lineNum)
    ctx.font = mainFontStr
    const mainBaseline = getTextActualCenterBaseline(ctx, yTop+main.rowHeight/2, restPart)
    ctx.font = subFontStr
    const subBaseline = getTextActualCenterBaseline(ctx, yTop+main.rowHeight+sub.rowHeight/2, subText)
    const giantTextWidth = giantBaseline.m.width
    const giantMarginRight = giantFontSize*0.05
    const mainWidthWithMargin = mainBaseline.m.width + giantMarginRight
    const subWidthWithDoubleMargin = subBaseline.m.width + giantMarginRight * 2
    const totalWidth = giantBaseline.m.width + Math.max(mainWidthWithMargin, subWidthWithDoubleMargin)
    let xLeft = x
    if(xSgn == 0)
        xLeft -= totalWidth/2
    else if(xSgn == -1)
        xLeft -= totalWidth
    if(needDraw){
        ctx.font = giantFontStr
        ctx.fillText(lineNum, xLeft, giantBaseline.shouldUseY)
    }

    let rightPartWidth = 0
    ctx.font = mainFontStr
    if(needDraw){
        ctx.font = mainFontStr
        const mainX = xLeft + giantTextWidth + giantMarginRight
        ctx.fillText(restPart, mainX, mainBaseline.shouldUseY)
    }
    if(needMeasure){
        rightPartWidth = mainBaseline.m.width
    }
    if(needDraw){
        ctx.font = subFontStr
        const subX = xLeft + giantTextWidth + giantMarginRight*2 //额外加一倍margin
        const subY = subBaseline.shouldUseY
        ctx.fillText(subText, subX, subY)
    }
    if(needMeasure){
        return {isDropCap: true, rect: getRect(x, y, xSgn, ySgn, totalWidth, totalHeight)}
    }
}


function getTextAlign(xSgn:SgnNumber){
    if(xSgn==-1)
        return 'right'
    else if(xSgn==0)
        return 'center'
    else
        return 'left'
}
function getYTop(y:number, ySgn:SgnNumber, totalHeight:number, rowMargin:number=0){
    let yTop = y;
    if(ySgn == -1){
        yTop -= totalHeight - rowMargin/2
    }else if(ySgn == 0){
        yTop -= totalHeight/2
    }else{
        yTop -= rowMargin/2
    }
    return yTop
}
function getRect(x:number, y:number, xSgn:SgnNumber, ySgn:number, biggestWidth:number, totalHeight:number){
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
    let yTop = y;
    if(ySgn == -1){
        yTop -= totalHeight
    }else if(ySgn == 0){
        yTop -= totalHeight/2
    }
    const leftUpper:Coord = [leftMost, yTop]
    const rightLower:Coord = [rightMost, yTop+totalHeight]
    const rect:RectCoord = [leftUpper, rightLower]
    return rect
}

type ActualBaselineResult = {shouldUseY:number, m:TextMetrics}
function getTextActualCenterBaseline(ctx:CanvasRenderingContext2D, wantMiddleAtY:number, text:string):ActualBaselineResult{
    const m = ctx.measureText(text)
    ctx.textBaseline = 'middle'
    const fix = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent)/2
    return {
        shouldUseY: wantMiddleAtY+fix,
        m
    }
}