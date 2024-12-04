import { SgnCoord } from "@/models/coord";
import { Line, LineType, TextTag } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { coordSub } from "@/utils/coordUtils/coordMath";
import { DrawTextBodyOption, drawTextForLineName } from "@/utils/drawUtils/drawText";
import { defineStore } from "pinia";

export const useTextTagCvsWorker = defineStore('textTagCvsWorker', ()=>{
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    function renderAllTextTags(ctx:CanvasRenderingContext2D){
        const allTags = saveStore.save?.textTags
        allTags?.forEach(t=>{
            renderOneTextTag(ctx, t)
        })
    }
    function renderOneTextTag(ctx:CanvasRenderingContext2D, t:TextTag){
        if(t?.forId){
            const line = saveStore.getLineById(t.forId)
            if(line){
                if(line.type===LineType.common)
                    renderForCommonLine(ctx, t, line)
            }
        }else{

        }
    }
    function renderForCommonLine(ctx:CanvasRenderingContext2D, t:TextTag, lineInfo:Line){
        const commonLineBuiltinRatio = 1.2
        const optMain:DrawTextBodyOption = {
            color: "white",
            font: cs.config.textTagFont,
            fontSize: cs.config.textTagFontSizeBase * commonLineBuiltinRatio,
            rowHeight: cs.config.textTagRowHeightBase * commonLineBuiltinRatio,
            text: lineInfo.name
        }
        const optSub:DrawTextBodyOption = {
            color: "white",
            font: cs.config.textTagSubFont,
            fontSize: cs.config.textTagSubFontSizeBase * commonLineBuiltinRatio,
            rowHeight: cs.config.textTagSubRowHeightBase * commonLineBuiltinRatio,
            text: lineInfo.nameSub
        }
        //dropCap线路名只能渲染成文本靠左，这里统一设置文本靠左（[1, 0]）
        //得到的矩形也是左侧同横坐标的
        const lineNameRectAlign:SgnCoord = [0, 0]
        const drawLineNameRes = drawTextForLineName(ctx, t.pos, lineNameRectAlign, optMain, optSub, false, 'measure')
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
            drawTextForLineName(ctx, t.pos, lineNameRectAlign, optMain, optSub, false, 'draw')
        }
        
    }
    return { renderAllTextTags }
})