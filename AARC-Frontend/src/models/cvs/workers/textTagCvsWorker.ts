import { Line, LineType, TextTag } from "@/models/save";
import { useConfigStore } from "@/models/stores/configStore";
import { useSaveStore } from "@/models/stores/saveStore";
import { coordSub } from "@/utils/coordUtils/coordMath";
import { drawText, DrawTextBodyOption } from "@/utils/drawUtils/drawText";
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
            fontStr: cs.textTagFontStr(commonLineBuiltinRatio),
            rowHeight: cs.config.textTagRowHeightBase * commonLineBuiltinRatio,
            text: lineInfo.name
        }
        const optSub:DrawTextBodyOption = {
            color: "white",
            fontStr: cs.textTagSubFontStr(commonLineBuiltinRatio),
            rowHeight: cs.config.textTagSubRowHeightBase * commonLineBuiltinRatio,
            text: lineInfo.nameSub
        }
        const rect = drawText(ctx, t.pos, [0, 0], optMain, optSub, false, 'measure')
        if(rect){
            const lu = rect[0]
            const wh = coordSub(rect[1], rect[0])
            ctx.fillStyle = lineInfo.color
            ctx.fillRect(...lu, ...wh)
            ctx.lineJoin = 'round'
            ctx.strokeStyle = lineInfo.color
            ctx.lineWidth = 14
            ctx.strokeRect(...lu, ...wh)
        }
        drawText(ctx, t.pos, [0, 0], optMain, optSub, false, 'draw')
    }
    return { renderAllTextTags }
})