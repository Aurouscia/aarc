import { useConfigStore } from "@/models/stores/configStore";
import { useEnvStore } from "@/models/stores/envStore";
import { useSnapStore } from "@/models/stores/snapStore";
import { defineStore, storeToRefs } from "pinia";

export const useGridCvsWorker = defineStore('gridCvsWorker', ()=>{
    const envStore = useEnvStore();
    const { getDisplayRatio } = envStore;
    const { cvsWidth, cvsHeight } = storeToRefs(envStore)
    const { snapGridIntv } = storeToRefs(useSnapStore())
    const cs = useConfigStore()
    function renderGrid(ctx:CanvasRenderingContext2D){
        let ratio = getDisplayRatio()
        const linesInfo = gridLinesInfo(ratio)
        snapGridIntv.value = linesInfo.subIntv

        ctx.lineWidth = linesInfo.subWidth
        ctx.strokeStyle = cs.config.gridSubLineColor
        drawGrid(ctx, linesInfo.subIntv)
        ctx.lineWidth = linesInfo.mainWidth
        ctx.strokeStyle = cs.config.gridMainLineColor
        drawGrid(ctx, linesInfo.mainIntv)
    }
    function drawGrid(ctx:CanvasRenderingContext2D, intv:number){
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
        if(xpx > 1500){
            mainIntv = 500
            subIntv = 100
            mainWidth = 4
            subWidth = 2
        }else if(xpx > 800){
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
})