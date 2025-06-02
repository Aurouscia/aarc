import { SgnCoord } from "@/models/coord";
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

export const useTextTagCvsWorker = defineStore('textTagCvsWorker', ()=>{
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    const textTagRectStore = useTextTagRectStore()
    const colorProcStore = useColorProcStore()
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
            renderSingle(ctx, t)
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
        const lineNameRectAlign:SgnCoord = [1, 0]
        const drawLineNameRes = drawTextForLineName(ctx, t.pos, lineNameRectAlign, undefined, optMain, optSub, false, 'measure')
        if(drawLineNameRes?.rect){
            const rect = drawLineNameRes.rect
            const lu = rect[0]
            const wh = coordSub(rect[1], rect[0])
            ctx.fillStyle = lineInfo.color
            ctx.fillRect(...lu, ...wh)
            ctx.lineJoin = 'round'
            ctx.strokeStyle = lineInfo.color
            const paddingLineWidth = cs.config.lineWidth * getPadding(t, cs.config.textTagForLine.padding??1)
            const paddingValue = paddingLineWidth/2
            if(paddingValue>0){
                ctx.lineWidth = paddingLineWidth
                ctx.strokeRect(...lu, ...wh)
            }
            drawTextForLineName(ctx, t.pos, lineNameRectAlign, 0, optMain, optSub, false, 'draw')
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
        const lineNameRectAlign:SgnCoord = [0, 0]
        const drawLineNameRes = drawTextForLineName(ctx, t.pos, lineNameRectAlign, undefined, optMain, optSub, {
            width: cs.config.textTagFontSizeBase * mainRatio/4,
            color: terrainColor,
            opacity: 1
        }, 'both')
        if(drawLineNameRes?.rect){
            const rect = drawLineNameRes.rect
            textTagRectStore.setTextTagRect(t.id, rect)
        }
    }
    function renderSingle(ctx:CvsContext, t:TextTag){
        const mo = t.textOp
        const so = t.textSOp
        const mainEmpty = !t.text?.trim()
        const subEmpty = mainEmpty && !t.textS?.trim()
        const mainRatio = getFontSize(mo, cs.config.textTagPlain.fontSize??1)
        const subRatio = getFontSize(so, cs.config.textTagPlain.subFontSize??1)
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
        const lineNameRectAlign:SgnCoord = [0, 0]
        const drawTextResRect = drawText(ctx, t.pos, lineNameRectAlign, t.textAlign, optMain, optSub, {
            width: cs.config.textTagFontSizeBase * mainRatio/4,
            color: cs.config.bgColor,
            opacity: 1
        }, 'both')
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
    return { renderAllTextTags, renderOneTextTag }
})