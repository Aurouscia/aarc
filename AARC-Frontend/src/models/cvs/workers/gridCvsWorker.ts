import { useConfigStore } from "@/models/stores/configStore";
import { useEnvStore } from "@/models/stores/envStore";
import { useSnapStore } from "@/models/stores/snapStore";
import { defineStore, storeToRefs } from "pinia";
import { CvsContext } from "../common/cvsContext";

export const useGridCvsWorker = defineStore('gridCvsWorker', ()=>{
    const envStore = useEnvStore();
    const { cvsWidth, cvsHeight } = storeToRefs(envStore)
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
    function gridLinesInfo():{mainIntv:number, subIntv:number, mainWidth:number, subWidth:number}{
        const displayRatio1000 = envStore.getDisplayRatio('smaller') * 1000
        let mainIntv:number
        let subIntv:number
        let mainWidth:number = 2
        let subWidth:number = 1
        if(displayRatio1000 > 3000){
            mainIntv = 500
            subIntv = 100
            mainWidth = 6
            subWidth = 3
        }
        else if(displayRatio1000 > 1800){
            mainIntv = 500
            subIntv = 100
            mainWidth = 4
            subWidth = 2
        }else if(displayRatio1000 > 1100){
            mainIntv = 100
            subIntv = 50
        }else if(displayRatio1000 > 600){
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