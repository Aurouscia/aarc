import { useEnvStore } from "@/models/stores/envStore";
import { gridMainColor, gridSubColor } from "@/utils/consts";
import { storeToRefs } from "pinia";

export function useGridCvsWorker(){
    const envStore = useEnvStore();
    const { getDisplayRatio } = envStore;
    const { cvsWidth, cvsHeight } = storeToRefs(envStore)
    function renderGrid(ctx:CanvasRenderingContext2D){
        let ratio = getDisplayRatio()
        const linesInfo = gridLinesInfo(ratio)
        ctx.lineWidth = linesInfo.mainWidth
        ctx.strokeStyle = gridMainColor
        drawGrid(ctx, linesInfo.mainIntv)
        ctx.lineWidth = linesInfo.subWidth
        ctx.strokeStyle = gridSubColor
        drawGrid(ctx, linesInfo.subIntv)
    }
    function drawGrid(ctx:CanvasRenderingContext2D, intv:number){
        if(intv <= 1){
            return
        }
        let x = intv;
        ctx.beginPath()
        while(x < cvsWidth.value){
            ctx.moveTo(x, 0);
            ctx.lineTo(x, cvsHeight.value);
            x += intv
        }
        let y = intv;
        while(y < cvsHeight.value){
            ctx.moveTo(0, y);
            ctx.lineTo(cvsWidth.value, y);
            y += intv
        }
        ctx.stroke()
    }
    function gridLinesInfo(ratio:number):{mainIntv:number, subIntv:number, mainWidth:number, subWidth:number}{
        const xpx = ratio*1000;
        let mainIntv:number
        let subIntv:number
        let mainWidth:number = 2
        let subWidth:number = 1
        if(xpx > 1200){
            mainIntv = 500
            subIntv = 100
            mainWidth = 4
            subWidth = 2
        }else if(xpx > 500){
            mainIntv = 100
            subIntv = 50
        }else{
            mainIntv = 100
            subIntv = 25
        }
        return {
            mainIntv, subIntv,
            mainWidth, subWidth
        }
    }
    return { renderGrid }
}