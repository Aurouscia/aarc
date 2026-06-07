import { useConfigStore } from "@/models/stores/configStore";
import { useSnapStore } from "@/models/stores/snapStore";
import { defineStore, storeToRefs } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useSaveStore } from "@/models/stores/saveStore";
import { useCvsFrameStore } from "@/models/stores/cvsFrameStore";
import { cvsRenderingBleed } from "@/utils/consts";
import { enlargeRectBy } from "@/utils/coordUtils/coordRect";
import { RectCoord } from "@/models/coord";

export interface RenderGridOptions{
    /** 可视区域比例，默认使用 cvsFrameStore */
    viewRectInRatio?: {left:number, right:number, top:number, bottom:number}
    /** 视图较长边长度，默认使用 cvsFrameStore */
    viewRectBiggerSideLength?: number
    /** 是否更新吸附间隔，导出时应设为 false */
    updateSnapGridIntv?: boolean
    /** 直接指定网格等级 1-5，优先级高于 viewRectBiggerSideLength */
    level?: number
}

export interface GridLinesInfo{
    mainIntv:number
    subIntv:number
    mainWidth:number
    subWidth:number
}

export const useGridCvsWorker = defineStore('gridCvsWorker', ()=>{
    const { cvsWidth, cvsHeight } = storeToRefs(useSaveStore())
    const cvsFrameStore = useCvsFrameStore()
    const { snapGridIntv } = storeToRefs(useSnapStore())
    const cs = useConfigStore()
    function renderGrid(ctx:CvsContext, options?:RenderGridOptions){
        const linesInfo = options?.level != null
            ? gridLinesInfoByLevel(options.level)
            : gridLinesInfo(options?.viewRectBiggerSideLength)
        if(options?.updateSnapGridIntv !== false){
            snapGridIntv.value = linesInfo.subIntv
        }

        ctx.lineWidth = linesInfo.subWidth
        ctx.strokeStyle = cs.config.gridSubLineColor
        drawGrid(ctx, linesInfo.subIntv, options?.viewRectInRatio)
        ctx.lineWidth = linesInfo.mainWidth
        ctx.strokeStyle = cs.config.gridMainLineColor
        drawGrid(ctx, linesInfo.mainIntv, options?.viewRectInRatio)
    }
    function drawGrid(ctx:CvsContext, intv:number, viewRectInRatio?:{left:number, right:number, top:number, bottom:number}){
        if(intv <= 1)
            return
        let {left, right, top, bottom} = viewRectInRatio ?? cvsFrameStore.getViewRectInRatio()
        const rect:RectCoord = [[left, top], [right, bottom]]
        const rectWithBleed:RectCoord = enlargeRectBy(rect, cvsRenderingBleed);
        [[left, top], [right, bottom]] = rectWithBleed;
        let x = intv;
        ctx.beginPath()
        while(x < cvsWidth.value){
            if(x >= cvsWidth.value*left){
                ctx.moveTo(x, 0);
                ctx.lineTo(x, cvsHeight.value);
            }
            if(x > cvsWidth.value*right){
                break
            }
            x += intv
        }
        let y = intv;
        while(y < cvsHeight.value){
            if(y >= cvsHeight.value*top){
                ctx.moveTo(0, y);
                ctx.lineTo(cvsWidth.value, y); 
            }
            if(y > cvsHeight.value*bottom){
                break 
            }
            y += intv
        }
        ctx.stroke()
    }
    function gridLinesInfoByLevel(level:number):GridLinesInfo{
        const levels:GridLinesInfo[] = [
            { mainIntv: 100, subIntv: 10, mainWidth: 1, subWidth: 0.5 },   // level 1 (最密)
            { mainIntv: 100, subIntv: 25, mainWidth: 2, subWidth: 1 },     // level 2
            { mainIntv: 100, subIntv: 50, mainWidth: 2, subWidth: 1 },     // level 3
            { mainIntv: 500, subIntv: 100, mainWidth: 4, subWidth: 2 },    // level 4
            { mainIntv: 500, subIntv: 100, mainWidth: 4, subWidth: 2 },    // level 5 (最疏)
        ]
        const idx = Math.max(0, Math.min(4, level - 1))
        return levels[idx]
    }
    function gridLinesInfo(viewRectBiggerSideLength?:number):GridLinesInfo{
        const side = viewRectBiggerSideLength ?? cvsFrameStore.getViewRectBiggerSideLength()
        if(side > 4000){
            return gridLinesInfoByLevel(5)
        }else if(side > 2300){
            return gridLinesInfoByLevel(4)
        }else if(side > 1100){
            return gridLinesInfoByLevel(3)
        }else if(side > 500){
            return gridLinesInfoByLevel(2)
        }else{
            return gridLinesInfoByLevel(1)
        }
    }
    return { renderGrid }
})