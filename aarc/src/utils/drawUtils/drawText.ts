import { Coord, RectCoord, SgnCoord, SgnNumber } from "@/models/coord"
//import { concatFontStr } from "../lang/fontStr"
import { splitLinesClean } from "../lang/splitLines"
import { CvsContext } from "@/models/cvs/common/cvsContext"
import { TextMetricsSelected } from "../type/TextMetricsSelected"

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
    ctx:CvsContext, pos:Coord, align:SgnCoord, textAlignOverride: SgnNumber|undefined,
    main:DrawTextBodyOption, sub:DrawTextBodyOption, stroke?:DrawTextStrokeOption|false,
    task:'draw'|'measure'|'both' = 'both', width?:number
    ): {rectFull:RectCoord, rectMain:RectCoord}|undefined
{
    const [x, y] = pos
    const [xSgn, ySgn] = align

    ctx.textBaseline = 'middle'
    const { mainHeight, subHeight, mainLines, subLines } = splitLines(main, sub)
    const totalHeight = mainHeight+subHeight
    const mainRowMargin = main.rowHeight - main.fontSize
    const subRowMargin = sub.rowHeight - sub.fontSize
    const yTop = getYTop(y, ySgn, totalHeight, mainRowMargin, subRowMargin) //减去文本上下的空隙（半个“行距与字体大小之差”）

    //const mainFontStr = concatFontStr(main.font, main.fontSize)
    //const subFontStr = concatFontStr(sub.font, sub.fontSize)
    const mainMeasures:ActualBaselineResult[] = []
    const subMeasures:ActualBaselineResult[] = []
    const enumerateMainLines = (fn:(text:string, ty:number, idx:number)=>void)=>{
        ctx.font = main
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
        ctx.font = sub
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
    //先测量所有行实际宽度
    enumerateMainLines(()=>{})
    enumerateSubLines(()=>{})

    const mainWidth = Math.max(...mainMeasures.map(x=>x.m.width))
    const biggestWidth = Math.max(mainWidth, ...subMeasures.map(x=>x.m.width))
    let xOffset = 0
    if(typeof textAlignOverride === 'number'){
        ctx.textAlign = getTextAlign(textAlignOverride)
        //如果textAlignOverride有值（意味着文本align与矩形align不一致）
        //则计算一个offset，让align不同的文本也刚好在矩形内
        const diff = textAlignOverride - align[0]
        xOffset = diff * biggestWidth/2
    }
    else
        //如果textAlignOverride没值（意味着文本align跟随矩形align）
        ctx.textAlign = getTextAlign(xSgn)
    const useX = x-xOffset

    const needDraw = task === 'draw' || task === 'both'
    const needMeasure = task === 'measure' || task === 'both'

    if(stroke && needDraw){
        const opacityOriginal = ctx.globalAlpha || 1
        ctx.strokeStyle = stroke.color
        ctx.globalAlpha = stroke.opacity
        ctx.lineWidth = stroke.width
        ctx.lineJoin = 'round'
        enumerateMainLines((text, ty)=>{
            ctx.strokeText(text, useX, ty)
        })
        enumerateSubLines((text, ty)=>{
            ctx.strokeText(text, useX, ty)
        })
        ctx.globalAlpha = opacityOriginal
    }

    ctx.fillStyle = main.color
    enumerateMainLines((text, ty)=>{
        if(needDraw)
            ctx.fillText(text, useX, ty)
    })

    ctx.fillStyle = sub.color
    enumerateSubLines((text, ty)=>{
        if(needDraw)
            ctx.fillText(text, useX, ty)
    })

    if(needMeasure){
        const rectFull = getRect(x, y, xSgn, ySgn, biggestWidth, totalHeight)
        const rectMain = getMainRectByFullRect(rectFull, xSgn, biggestWidth, mainWidth, totalHeight, mainHeight)
        if(width){
            //如果指定了宽度，将矩形的宽度调整为指定宽度
            enlargeRectToWidth(rectFull, xSgn, width)
        }
        return {
            rectFull,
            rectMain
        }
    }
}

const chineseStyleDropCapPattern = /^[0-9a-zA-Z]{1,3}(?=\s?号?环?线$)/
export function drawTextForLineName(
    ctx:CvsContext, pos:Coord, align:SgnCoord, textAlignOverride:SgnNumber,
    main:DrawTextBodyOption, sub:DrawTextBodyOption, stroke?:DrawTextStrokeOption|false,
    task:'draw'|'measure'|'both' = 'both', width?:number, dropCap?:boolean):
    {isDropCap:boolean, rect:RectCoord|undefined}|undefined
{
    const mainText = main.text?.trim() || ''
    const subText = sub.text?.trim() || ''
    const match = chineseStyleDropCapPattern.exec(mainText)
    const useDropCap = dropCap && match && match.length>0 && subText
    if(!useDropCap)
    {
        //如果不是需要dropCap的线路名，则fallback到一般的写法
        const textAlign = textAlignOverride
        return {
            isDropCap:false,
            rect:drawText(ctx, pos, align, textAlign, main, sub, stroke, task, width)?.rectFull
        }
    }
    const needDraw = task === 'draw' || task === 'both'
    const needMeasure = task === 'measure' || task === 'both'
    const totalHeight = main.rowHeight + sub.rowHeight

    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left' //如果是dropCap线路名，固定靠左
    const [x, y] = pos
    const [xSgn, ySgn] = align
    const yTop = getYTop(y, ySgn, totalHeight)

    const lineNum = match[0]
    const restPart = mainText.substring(lineNum.length).trim()
    const fontPadding = (main.rowHeight - main.fontSize + sub.rowHeight - sub.fontSize)
    const giantFontSize = main.fontSize + sub.fontSize + fontPadding
    const giantTextRowHeight = main.rowHeight + sub.rowHeight
    //const giantFontStr = concatFontStr(main.font, giantFontSize)
    //const mainFontStr = concatFontStr(main.font, main.fontSize)
    //const subFontStr = concatFontStr(sub.font, sub.fontSize)
    const giant = {font:main.font, fontSize:giantFontSize}
    ctx.font = giant
    const giantBaseline = getTextActualCenterBaseline(ctx, yTop+giantTextRowHeight/2, lineNum)
    ctx.font = main
    const mainBaseline = getTextActualCenterBaseline(ctx, yTop+main.rowHeight/2, restPart)
    ctx.font = sub
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
        ctx.font = giant
        ctx.fillStyle = main.color
        ctx.fillText(lineNum, xLeft, giantBaseline.shouldUseY)
    }

    ctx.font = main
    if(needDraw){
        ctx.font = main
        const mainX = xLeft + giantTextWidth + giantMarginRight
        ctx.fillStyle = main.color
        ctx.fillText(restPart, mainX, mainBaseline.shouldUseY)
    }
    if(needDraw){
        ctx.font = sub
        const subX = xLeft + giantTextWidth + giantMarginRight*2 //额外加一倍margin
        const subY = subBaseline.shouldUseY
        ctx.fillStyle = sub.color
        ctx.fillText(subText, subX, subY)
    }
    if(needMeasure){
        const rect = getRect(x, y, xSgn, ySgn, totalWidth, totalHeight)
        if(width){
            //如果指定了宽度，将矩形的宽度调整为指定宽度
            enlargeRectToWidth(rect, xSgn, width)
        }
        return {
            isDropCap: true,
            rect
        }
    }
}

export function splitLines(main:DrawTextBodyOption, sub:DrawTextBodyOption){
    const mainLines = splitLinesClean(main.text)
    const mainHeight = mainLines.length * main.rowHeight
    const subLines = splitLinesClean(sub.text)
    const subHeight = subLines.length * sub.rowHeight
    return {mainHeight, subHeight, mainLines, subLines}
}

function getTextAlign(xSgn:SgnNumber){
    if(xSgn==-1)
        return 'right'
    else if(xSgn==0)
        return 'center'
    else
        return 'left'
}
function getYTop(y:number, ySgn:SgnNumber, totalHeight:number, mainRowMargin:number=0, subRowMargin:number=0){
    let yTop = y;
    if(ySgn == -1){
        yTop -= totalHeight - subRowMargin/2
    }else if(ySgn == 0){
        yTop -= totalHeight/2
    }else{
        yTop -= mainRowMargin/2
    }
    return yTop
}
function getRect(x:number, y:number, xSgn:SgnNumber, ySgn:number, biggestWidth:number, totalHeight:number){
    let leftMost = Number(x);
    let rightMost = Number(x); // 有些时候（可能是老存档）这里的x是字符串，造成字符串加法计算
    if(Number.isNaN(leftMost))
        leftMost = 0
    if(Number.isNaN(rightMost))
        rightMost = 0
    // 以上的部分会被js引擎优化，开销忽略不计
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
function getMainRectByFullRect(
    rect:RectCoord, xSgn:SgnNumber, 
    fullWidth:number, mainWidth:number, fullHeight:number, mainHeight:number){
    const mainRect:RectCoord = [[...rect[0]], [...rect[1]]]
    const widthDiff = fullWidth - mainWidth
    const heightDiff = fullHeight - mainHeight
    if(xSgn == -1){
        mainRect[0][0] += widthDiff
    }else if(xSgn == 0){
        mainRect[0][0] += widthDiff/2
        mainRect[1][0] -= widthDiff/2
    }else{
        mainRect[1][0] -= widthDiff
    }
    mainRect[1][1] -= heightDiff
    return mainRect
}
function enlargeRectToWidth(rect:RectCoord, xSgn:SgnNumber, width:number):void{
    //若rect的宽度小于width，则放大rect到指定宽度（以xSgn指定的方向）
    width = Number(width)
    if(isNaN(width)) return
    const widthDiff = width - (rect[1][0] - rect[0][0])
    if(widthDiff <= 0)
        return
    if(xSgn == -1){
        rect[0][0] -= widthDiff 
    }
    else if(xSgn == 0){
        rect[0][0] -= widthDiff/2
        rect[1][0] += widthDiff/2 
    }
    else{
        rect[1][0] += widthDiff 
    }
}

type ActualBaselineResult = {shouldUseY:number, m:TextMetricsSelected}
function getTextActualCenterBaseline(ctx:CvsContext, wantMiddleAtY:number, text:string):ActualBaselineResult{
    const m = ctx.measureText(text)
    ctx.textBaseline = 'middle'
    const fix = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent)/2
    return {
        shouldUseY: wantMiddleAtY+fix,
        m
    }
}