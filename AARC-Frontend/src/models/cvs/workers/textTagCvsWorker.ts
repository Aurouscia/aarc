import { Coord, SgnCoord } from "@/models/coord";
import { Line, LineType, TextOptions, TextTag } from "@/models/save";
import { useColorProcStore } from "@/models/stores/utils/colorProcStore";
import { useConfigStore } from "@/models/stores/configStore";
import { useTextTagRectStore } from "@/models/stores/saveDerived/textTagRectStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { coordSub } from "@/utils/coordUtils/coordMath";
import { drawText, DrawTextBodyOption, drawTextForLineName } from "@/utils/drawUtils/drawText";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { enlargeRect } from "@/utils/coordUtils/coordRect";
import { TextTagPerTypeGlobalConfig } from "@/models/config";
import { TextTagIconData, useIconStore } from "@/models/stores/iconStore";

export const useTextTagCvsWorker = defineStore('textTagCvsWorker', ()=>{
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    const textTagRectStore = useTextTagRectStore()
    const colorProcStore = useColorProcStore()
    const iconStore = useIconStore()
    function renderAllTextTags(ctx:CvsContext){
        const allTags = saveStore.save?.textTags
        allTags?.forEach(t=>{
            renderOneTextTag(ctx, t)
        })
    }
    function renderOneTextTag(ctx:CvsContext, t:TextTag){
        if(t?.forId){
            const line = saveStore.getLineById(t.forId)
            if(line){
                if(line.type===LineType.common)
                    renderForCommonLine(ctx, t, line)
                else if(line.type===LineType.terrain){
                    renderForTerrainLine(ctx, t, line)
                }
            }
        }else{
            renderPlain(ctx, t)
        }
    }
    function renderForCommonLine(ctx:CvsContext, t:TextTag, lineInfo:Line){
        const commonLineBuiltinRatio = 1.2
        const mainRatio = getFontSize(t.textOp, cs.config.textTagForLine.fontSize??1) * commonLineBuiltinRatio
        const subRatio = getFontSize(t.textSOp, cs.config.textTagForLine.subFontSize??1) * commonLineBuiltinRatio
        const textColor = lineInfo.tagTextColor ?? colorProcStore.colorProcInvBinary.convert(lineInfo.color)
        const mainEmpty = !t.text?.trim()
        const subEmpty = mainEmpty && !t.textS?.trim()
        const optMain:DrawTextBodyOption = {
            color: textColor,
            font: cs.config.textTagFont,
            fontSize: cs.config.textTagFontSizeBase * mainRatio,
            rowHeight: cs.config.textTagRowHeightBase * mainRatio,
            text: !mainEmpty ? t.text?.trim() : (lineInfo.name || '未命名线路')
        }
        const optSub:DrawTextBodyOption = {
            color: textColor,
            font: cs.config.textTagSubFont,
            fontSize: cs.config.textTagSubFontSizeBase * subRatio,
            rowHeight: cs.config.textTagSubRowHeightBase * subRatio,
            text: !subEmpty ? t.textS?.trim() : lineInfo.nameSub
        }
        const { anchor, textAlign, width } = getParams(cs.config.textTagForLine, t)
        const dropCap = t.dropCap ?? cs.config.textTagForLineDropCap
        const paddingLineWidth = cs.config.lineWidth * getPadding(t, cs.config.textTagForLine.padding??1)
        const paddingValue = paddingLineWidth/2
        const needJustifyPos = cs.config.textTagForLine.edgeAnchorOutsidePadding ?? false
        const justifiedPos = needJustifyPos 
            ? justifyPosByAnchorAndPadding(t.pos, anchor, paddingValue) 
            : t.pos
        const drawLineNameRes = drawTextForLineName(
            ctx, justifiedPos, anchor, textAlign, optMain, optSub, false, 'measure', width, dropCap)
        if(drawLineNameRes?.rect){
            const rect = drawLineNameRes.rect
            const lu = rect[0]
            const wh = coordSub(rect[1], rect[0])
            ctx.fillStyle = lineInfo.color
            ctx.fillRect(...lu, ...wh)
            ctx.lineJoin = 'round'
            ctx.strokeStyle = lineInfo.color
            if(paddingValue>0){
                ctx.lineWidth = paddingLineWidth
                ctx.strokeRect(...lu, ...wh)
            }
            drawTextForLineName(ctx, justifiedPos, anchor, textAlign, optMain, optSub, false, 'draw', width, dropCap)
            const rectEnlarged = enlargeRect(rect, paddingValue)
            textTagRectStore.setTextTagRect(t.id, rectEnlarged)
        }
        
    }
    function renderForTerrainLine(ctx:CvsContext, t:TextTag, lineInfo:Line){
        const terrainLineBuiltinRatio = 1.2
        const mainRatio = getFontSize(t.textOp, cs.config.textTagForTerrain.fontSize??1) * terrainLineBuiltinRatio
        const subRatio = getFontSize(t.textSOp, cs.config.textTagForTerrain.subFontSize??1) * terrainLineBuiltinRatio
        const terrainColor = saveStore.getLineActualColor(lineInfo)
        const textColor = colorProcStore.colorProcTerrainTag.convert(terrainColor)
        const mainEmpty = !t.text?.trim()
        const subEmpty = mainEmpty && !t.textS?.trim()
        const optMain:DrawTextBodyOption = {
            color: textColor,
            font: cs.config.textTagFont,
            fontSize: cs.config.textTagFontSizeBase * mainRatio,
            rowHeight: cs.config.textTagRowHeightBase * mainRatio,
            text: !mainEmpty ? t.text?.trim() : (lineInfo.name || '未命名地形')
        }
        const optSub:DrawTextBodyOption = {
            color: textColor,
            font: cs.config.textTagSubFont,
            fontSize: cs.config.textTagSubFontSizeBase * subRatio,
            rowHeight: cs.config.textTagSubRowHeightBase * subRatio,
            text: !subEmpty ? t.textS?.trim() : lineInfo.nameSub
        }
        const { anchor, textAlign } = getParams(cs.config.textTagForTerrain, t)
        const drawLineNameRes = drawTextForLineName(ctx, t.pos, anchor, textAlign, optMain, optSub, {
            width: cs.config.textTagFontSizeBase * mainRatio/4,
            color: terrainColor,
            opacity: 1
        }, 'both')
        if(drawLineNameRes?.rect){
            const rect = drawLineNameRes.rect
            textTagRectStore.setTextTagRect(t.id, rect)
        }
    }
    function renderPlain(ctx:CvsContext, t:TextTag){
        const mo = t.textOp
        const so = t.textSOp
        const mainEmpty = !t.text?.trim()
        const subEmpty = mainEmpty && !t.textS?.trim()
        const mainRatio = getFontSize(mo, cs.config.textTagPlain.fontSize??1)
        const subRatio = getFontSize(so, cs.config.textTagPlain.subFontSize??1)
        const { anchor, textAlign } = getParams(cs.config.textTagPlain, t)
        const textDrawPos:Coord = [...t.pos]

        const iconId = t.icon
        const icon = saveStore.save?.textTagIcons?.find(x=>x.id==iconId)
        let idata:TextTagIconData|undefined = undefined
        let iconWidth = 0, iconHeight = 0
        let getIconPosX:((tposX:number, tw:number)=>number) = (x)=>x;//怎么通过t.pos和文本部分的宽高确定icon中心位置
        let getIconPosY:((tposY:number, th:number)=>number) = (y)=>y;
        if(icon){
            idata = iconStore.getDataByIconId(icon.id)
            if(idata?.status==='loaded' && idata?.naturalWidth && idata.naturalHeight){
                const iw = icon.width ?? 50
                const iwhr = idata.naturalWidth / idata.naturalHeight
                const ih = iw / iwhr
                iconWidth = iw; iconHeight = ih;
                if(textAlign===0){
                    //文本居中时，icon放在顶部，可能会把text往下挤
                    if(anchor[1]===-1){
                        //y锚点在底部时，text不动
                        getIconPosY = (posY, th)=>posY-(th+ih/2)
                    }else if(anchor[1]===0){
                        textDrawPos[1]+=ih/2 
                        getIconPosY = (posY, th)=>posY-th/2
                    }else{
                        textDrawPos[1]+=ih
                        getIconPosY = (posY)=>posY+ih/2
                    }
                    if(anchor[0]===-1){
                        getIconPosX = (posX, tw)=>posX-tw/2
                    }else if(anchor[0]===1){
                        getIconPosX = (posX, tw)=>posX+tw/2
                    }
                }else{
                    if(textAlign===-1){
                        //文本靠右时，icon放在右侧，可能会把text往左挤
                        if(anchor[0]===1){
                            //x锚点在左侧时，text不动
                            getIconPosX = (posX, tw)=>posX+tw+iw/2
                        }else if(anchor[0]===0){
                            textDrawPos[0]-=iw/2
                            getIconPosX = (posX, tw)=>posX+tw/2
                        }else{
                            textDrawPos[0]-=iw
                            getIconPosX = (posX)=>posX-=iw/2
                        }
                    }else{
                        //文本靠左时，icon放在左侧，可能会把text往右挤
                        if(anchor[0]===-1){
                            //x锚点在右侧时，text不动
                            getIconPosX = (posX, tw)=>posX-(tw+iw/2)
                        }else if(anchor[0]===0){
                            textDrawPos[0]+=iw/2
                            getIconPosX = (posX, tw)=>posX-tw/2
                        }else{
                            textDrawPos[0]+=iw
                            getIconPosX = (posX)=>posX+iw/2
                        }
                    }
                    if(anchor[1]===-1){
                        getIconPosY = (posY, th)=>posY-th/2
                    }else if(anchor[1]===1){
                        getIconPosY = (posY, th)=>posY+th/2
                    }
                }
            }
        }

        const optMain:DrawTextBodyOption = {
            color: mo?.color || cs.config.textTagFontColorHex,
            font: cs.config.textTagFont,
            fontSize: cs.config.textTagFontSizeBase * mainRatio,
            rowHeight: cs.config.textTagRowHeightBase * mainRatio,
            text: !mainEmpty ? t.text?.trim() : '空文本标签'
        }
        const optSub:DrawTextBodyOption = {
            color: so?.color || cs.config.textTagSubFontColorHex,
            font: cs.config.textTagSubFont,
            fontSize: cs.config.textTagSubFontSizeBase * subRatio,
            rowHeight: cs.config.textTagSubRowHeightBase * subRatio,
            text: !subEmpty ? t.textS?.trim(): 'Empty TextTag'
        }
        const drawTextResRect = drawText(ctx, textDrawPos, anchor, textAlign, optMain, optSub, {
            width: cs.config.textTagFontSizeBase * mainRatio/4,
            color: cs.config.bgColor,
            opacity: 1
        }, 'both', undefined, t.carpet || t.carpet==undefined)
        if(icon && idata?.img && getIconPosY && getIconPosX){
            let tw = 0, th = 0;
            const rectFull = drawTextResRect?.rectFull
            if(rectFull){
                tw = rectFull[1][0] - rectFull[0][0]
                th = rectFull[1][1] - rectFull[0][1]
            }
            const ipx = getIconPosX(t.pos[0], tw)
            const ipy = getIconPosY(t.pos[1], th)
            const iconPos:Coord = [ipx, ipy]
            iconPos[0]-=iconWidth/2; iconPos[1]-=iconHeight/2
            ctx.drawImage(idata.img, ...iconPos, iconWidth, iconHeight)
        }
        if(drawTextResRect){
            const rect = drawTextResRect
            textTagRectStore.setTextTagRect(t.id, rect.rectFull)
        }
    }
    function getFontSize(textOptions:TextOptions|undefined, fallback:number):number{
        //坑爹的input会把值设为string
        let val:number|string|undefined = textOptions?.size
        if(val===undefined)
            val = 0
        else
            val = Number(val)
        if(val < 0)
            val = 0
        if(val > 16)
            val = 16
        return val || fallback
    }
    function getPadding(textTag:TextTag, fallback:number):number{
        //坑爹的input会把值设为string
        let val:number|string|undefined = textTag.padding
        if(val===undefined)
            val = 0
        else
            val = Number(val)
        if(val < 0)
            val = 0
        if(val > 16)
            val = 16
        return val || fallback
    }
    function getParams(config:TextTagPerTypeGlobalConfig, options:TextTag){
        const anchorX = options.anchorX ?? config.anchorX ?? 0
        const anchorY = options.anchorY ?? config.anchorY ?? 0
        const anchor:SgnCoord = [anchorX, anchorY]

        const width = Number(options.width) || Number(config.width) || 0
        
        //textAlign全局设置为undefined其实指的是默认值null(跟随anchorX)
        const globalTextAlignMean = config.textAlign ?? null 

        //仅在options为undefined时使用全局设置，null也是个有效值(跟随anchorX)
        let textAlign = options.textAlign===undefined ? globalTextAlignMean : options.textAlign
        
        if(textAlign === null)
            textAlign = anchorX //textAlign为null指的是跟随anchorX
        return{
            anchor,
            textAlign,
            width
        }
    }
    function justifyPosByAnchorAndPadding(originalPos:Coord, anchor:SgnCoord, paddingValue:number):Coord{
        let [ x, y ] = originalPos
        if(anchor[0]===-1)
            x -= paddingValue
        else if(anchor[0]===1)
            x += paddingValue
        if(anchor[1]===-1)
            y -= paddingValue
        else if(anchor[1]===1)
            y += paddingValue
        return [ x, y ]
    }
    return { renderAllTextTags, renderOneTextTag }
})