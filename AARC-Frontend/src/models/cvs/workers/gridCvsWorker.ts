import { useConfigStore } from "@/models/stores/configStore";
import { useSnapStore } from "@/models/stores/snapStore";
import { defineStore, storeToRefs } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useSaveStore } from "@/models/stores/saveStore";
import { useCvsFrameStore } from "@/models/stores/cvsFrameStore";
import { cvsRenderingBleed } from "@/utils/consts";
import { enlargeRectBy } from "@/utils/coordUtils/coordRect";
import { RectCoord } from "@/models/coord";

export const useGridCvsWorker = defineStore('gridCvsWorker', ()=>{
    const { cvsWidth, cvsHeight } = storeToRefs(useSaveStore())
    const cvsFrameStore = useCvsFrameStore()
    const { snapGridIntv } = storeToRefs(useSnapStore())
    const cs = useConfigStore()
    function renderGrid(ctx:CvsContext){
        const linesInfo = gridLinesInfo()
        snapGridIntv.value = linesInfo.subIntv

        ctx.lineWidth = linesInfo.subWidth
        ctx.strokeStyle = cs.config.gridSubLineColor
        drawGrid(ctx, linesInfo.subIntv)
        ctx.lineWidth = linesInfo.mainWidth
        ctx.strokeStyle = cs.config.gridMainLineColor
        drawGrid(ctx, linesInfo.mainIntv)
    }
    function drawGrid(ctx:CvsContext, intv:number){
        if(intv <= 1)
            return
        let {left, right, top, bottom} = cvsFrameStore.getViewRectInRatio()
        const rect:RectCoord = [[left, top], [right, bottom]]
        const rectWithBleed:RectCoord = enlargeRectBy(rect, cvsRenderingBleed);
        [[left, top], [right, bottom]] = rectWithBleed;
        let x = intv;
        ctx.beginPath()
        let loopTime = 0
        let lineCount = 0
        while(x < cvsWidth.value){
            loopTime++
            if(x >= cvsWidth.value*left){
                lineCount++
                ctx.moveTo(x, 0);
                ctx.lineTo(x, cvsHeight.value);
            }
            if(x > cvsWidth.value*right){
                break
            }
            x += intv
        }
        console.log(loopTime, lineCount)
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
    function gridLinesInfo():{mainIntv:number, subIntv:number, mainWidth:number, subWidth:number}{
        const side = cvsFrameStore.getViewRectBiggerSideLength()
        let mainIntv:number
        let subIntv:number
        let mainWidth:number = 2
        let subWidth:number = 1
        if(side > 4000){
            mainIntv = 500
            subIntv = 100
            mainWidth = 6
            subWidth = 3
        }
        else if(side > 2300){
            mainIntv = 500
            subIntv = 100
            mainWidth = 4
            subWidth = 2
        }else if(side > 1100){
            mainIntv = 100
            subIntv = 50
        }else if(side > 500){
            mainIntv = 100
            subIntv = 25
        }else{
            mainIntv = 100
            subIntv = 10
            subWidth = 0.5
        }
        return {
            mainIntv, subIntv,
            mainWidth, subWidth
        }
    }
    return { renderGrid }
})