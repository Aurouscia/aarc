import { useExportLocalConfigStore } from "@/app/localConfig/exportLocalConfig"
import { defineStore } from "pinia"
import { CvsContext } from "../common/cvsContext"
import { useSaveStore } from "@/models/stores/saveStore"

export const useWatermarkCvsWorker = defineStore('watermarkCvsWorker',()=>{
    const exportLocalConfig = useExportLocalConfigStore()
    const saveStore = useSaveStore()
    function renderWatermark(ctx:CvsContext, forExport?:boolean){
        const cfg = exportLocalConfig.readExportWatermarkLocalConfig()
        if(forExport){
            if(!cfg.enabled)
                return
        }else{
            if(!cfg.enabledPreview)
                return
        }

        let fontSize = cfg.fontSize??30
        if(typeof fontSize === 'string'){ fontSize = parseInt(fontSize) }
        let opacity = cfg.opacity
        if(typeof opacity ==='string'){ opacity = parseFloat(opacity) }
        ctx.globalAlpha = opacity??0.3
        let xDist = cfg.xDist??0
        if(typeof xDist ==='string'){ xDist = parseInt(xDist) }
        let yDist = cfg.yDist??0
        if(typeof yDist ==='string'){ yDist = parseInt(yDist) }
        let xOffset = cfg.xOffset??0
        if(typeof xOffset ==='string'){ xOffset = parseInt(xOffset) }

        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillStyle = 'black'
        ctx.font = {fontSize, font:'sans-serif'}

        const text = cfg.text??'测试水印'
        const measureRes = ctx.measureText(text)
        const textWidth = measureRes.width
        const xDistUsed = (xDist ?? textWidth)+textWidth
        const yDistUsed = (yDist ?? fontSize)+fontSize
        let y = yDist/2
        let yIdx = 0
        let safety = 10000
        while(y < saveStore.cvsHeight && safety > 0){
            //确认初始x，使得最左侧的文字刚好在画布内
            let x = xDist/2 + yIdx*xOffset
            while(x > 0){
                x -= xDistUsed
            }
            while(x < saveStore.cvsWidth && safety > 0){
                //TODO:旋转
                ctx.fillText(text, x, y)
                x += xDistUsed
                safety--
            }
            y += yDistUsed
            yIdx++
        }
        ctx.globalAlpha = 1
    }
    return { renderWatermark }
})