import { defineStore } from "pinia";
import { LocalConfig } from "./common/localConfig";

class ExportLocalConfig extends LocalConfig{
    protected storageSectorName() { return 'export'}
}

export interface ExportWatermarkLocalConfig{
    enabled?:boolean,
    enabledPreview?:boolean
    text?:string,
    fontSize?:number|string
    opacity?:number|string
    coverMode?:'under'|'over'
    xDist?:number|string
    yDist?:number|string
    xOffset?:number|string
    rotate?:number|string
}

export const useExportLocalConfigStore = defineStore('exportLocalConfig',()=>{
    const exportFileNameStyleKey = 'exportFileNameStyle'
    const exportWithAdsKey = 'exportWithAds'
    const exportPixelRestrictKey = 'exportPixelRestrict'
    const exportWatermarkKey = 'watermark'
    const cfg = new ExportLocalConfig()

    function exportWaterMarkDefault():ExportWatermarkLocalConfig{
        return {enabled:false,text:'测试水印',fontSize:300,opacity:0.1,coverMode:'under',xDist:400,yDist:300,xOffset:400,rotate:0}
    }
    function readExportWatermarkLocalConfig():ExportWatermarkLocalConfig{
        const wmcJson = cfg.readLocalConfig(exportWatermarkKey) 
        let wmc:ExportWatermarkLocalConfig
        if(!wmcJson){
            wmc = exportWaterMarkDefault()
            saveExportWatermarkLocalConfig(wmc)
            return wmc
        }
        try{
            wmc = JSON.parse(wmcJson) as ExportWatermarkLocalConfig
        }catch{
            wmc = exportWaterMarkDefault()
            saveExportWatermarkLocalConfig(wmc)
            return wmc
        }
        return wmc
    }
    function saveExportWatermarkLocalConfig(wmc:ExportWatermarkLocalConfig){
        cfg.saveLocalConfig(exportWatermarkKey, JSON.stringify(wmc))
    }
    function resetExportWatermarkLocalConfig(){
        const defaultVal = exportWaterMarkDefault()
        saveExportWatermarkLocalConfig(defaultVal)
        return defaultVal
    }

    return {
        readExportFileNameStyle: ()=>cfg.readLocalConfig(exportFileNameStyleKey),
        saveExportFileNameStyle: (style:string)=>cfg.saveLocalConfig(exportFileNameStyleKey, style),
        readExportWithAds: ()=>cfg.readLocalConfig(exportWithAdsKey),
        saveExportWithAds: (ads:string)=>cfg.saveLocalConfig(exportWithAdsKey, ads),
        readExportPixelRestrict: ()=>cfg.readLocalConfig(exportPixelRestrictKey),
        saveExportPixelRestrict: (pixel:string)=>cfg.saveLocalConfig(exportPixelRestrictKey, pixel),
        readExportWatermarkLocalConfig,
        saveExportWatermarkLocalConfig,
        resetExportWatermarkLocalConfig
    }
})