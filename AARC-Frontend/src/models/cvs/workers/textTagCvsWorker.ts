import { Coord } from "@/models/coord";
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
        const drawLineNameRes = drawTextForLineName(ctx, t.pos, [1, 0], optMain, optSub, false, 'measure')
        if(drawLineNameRes?.rect){
            //线路名标签最终相对坐标左右居中，上下靠下
            //如果是DropCap线路名，内部的文字靠左
            //如果不是，内部的文字居中
            const rect = drawLineNameRes.rect
            const lu = rect[0]
            const wh = coordSub(rect[1], rect[0])
            const halfW = wh[0]/2
            lu[0] -= halfW //矩形的左上角 统一向左移动半个矩形宽度
            ctx.fillStyle = lineInfo.color
            ctx.fillRect(...lu, ...wh)
            ctx.lineJoin = 'round'
            ctx.strokeStyle = lineInfo.color
            ctx.lineWidth = 14
            ctx.strokeRect(...lu, ...wh)
            if(drawLineNameRes.isDropCap){
                //是DropCap线路名
                //文本坐标向左移动半个矩形宽度（随矩形一起移动）
                const centralizedPos = [t.pos[0] - halfW, t.pos[1]] as Coord
                drawTextForLineName(ctx, centralizedPos, [1, 0], optMain, optSub, false, 'draw')
            }else{
                //非DropCap线路名
                //文本坐标不变，但文字设为左右居中（[0, 0] 的 第一元素）
                drawTextForLineName(ctx, t.pos, [0, 0], optMain, optSub, false, 'draw')
            }
        }
        
    }
    return { renderAllTextTags }
})