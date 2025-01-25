import { SgnCoord } from "@/models/coord";
import { Line, LineType, TextTag } from "@/models/save";
import { useColorProcStore } from "@/models/stores/utils/colorProcStore";
import { useConfigStore } from "@/models/stores/configStore";
import { useTextTagRectStore } from "@/models/stores/saveDerived/textTagRectStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { coordSub } from "@/utils/coordUtils/coordMath";
import { drawText, DrawTextBodyOption, drawTextForLineName } from "@/utils/drawUtils/drawText";
import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";

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
        const textColor = colorProcStore.colorProcInvBinary.convert(lineInfo.color)
        const optMain:DrawTextBodyOption = {
            color: textColor,
            font: cs.config.textTagFont,
            fontSize: cs.config.textTagFontSizeBase * commonLineBuiltinRatio,
            rowHeight: cs.config.textTagRowHeightBase * commonLineBuiltinRatio,
            text: t.text?.trim() || lineInfo.name
        }
        const optSub:DrawTextBodyOption = {
            color: textColor,
            font: cs.config.textTagSubFont,
            fontSize: cs.config.textTagSubFontSizeBase * commonLineBuiltinRatio,
            rowHeight: cs.config.textTagSubRowHeightBase * commonLineBuiltinRatio,
            text: t.textS?.trim() || lineInfo.nameSub
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
            ctx.lineWidth = 14
            ctx.strokeRect(...lu, ...wh)
            drawTextForLineName(ctx, t.pos, lineNameRectAlign, 0, optMain, optSub, false, 'draw')
            textTagRectStore.setTextTagRect(t.id, rect)
        }
        
    }
    function renderForTerrainLine(ctx:CvsContext, t:TextTag, lineInfo:Line){
        const terrainLineBuiltinRatio = 1.2
        const terrainColor = saveStore.getLineActualColor(lineInfo)
        const textColor = colorProcStore.colorProcTerrainTag.convert(terrainColor)
        const optMain:DrawTextBodyOption = {
            color: textColor,
            font: cs.config.textTagFont,
            fontSize: cs.config.textTagFontSizeBase * terrainLineBuiltinRatio,
            rowHeight: cs.config.textTagRowHeightBase * terrainLineBuiltinRatio,
            text: t.text?.trim() || lineInfo.name
        }
        const optSub:DrawTextBodyOption = {
            color: textColor,
            font: cs.config.textTagSubFont,
            fontSize: cs.config.textTagSubFontSizeBase * terrainLineBuiltinRatio,
            rowHeight: cs.config.textTagSubRowHeightBase * terrainLineBuiltinRatio,
            text: t.textS?.trim() || lineInfo.nameSub
        }
        const lineNameRectAlign:SgnCoord = [0, 0]
        const drawLineNameRes = drawTextForLineName(ctx, t.pos, lineNameRectAlign, undefined, optMain, optSub, {
            width: cs.config.textTagFontSizeBase * terrainLineBuiltinRatio/4,
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
        const optMain:DrawTextBodyOption = {
            color: mo?.color || cs.config.textTagFontColorHex,
            font: cs.config.textTagFont,
            fontSize: cs.config.textTagFontSizeBase * (mo?.size || 1),
            rowHeight: cs.config.textTagRowHeightBase * (mo?.size || 1),
            text: !mainEmpty ? t.text?.trim() : '空文本标签'
        }
        const optSub:DrawTextBodyOption = {
            color: so?.color || cs.config.textTagSubFontColorHex,
            font: cs.config.textTagSubFont,
            fontSize: cs.config.textTagSubFontSizeBase * (so?.size || 1),
            rowHeight: cs.config.textTagSubRowHeightBase * (so?.size || 1),
            text: !subEmpty ? t.textS?.trim(): 'Empty TextTag'
        }
        const lineNameRectAlign:SgnCoord = [0, 0]
        const drawLineNameResRect = drawText(ctx, t.pos, lineNameRectAlign, undefined, optMain, optSub, {
            width: cs.config.textTagFontSizeBase * (mo?.size || 1)/4,
            color: cs.config.bgColor,
            opacity: 1
        }, 'both')
        if(drawLineNameResRect){
            const rect = drawLineNameResRect
            textTagRectStore.setTextTagRect(t.id, rect)
        }
    }
    return { renderAllTextTags, renderOneTextTag }
})