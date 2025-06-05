import { defineStore } from "pinia";
import { ref } from "vue";
import { localConfigKeyPrefix } from "./common/keyPrefix";

export type ExportFileNameStyle = 'plain'|'date'|'dateTime'|'lineCount'
export type AdsRenderType = 'no'|'less'|'more'
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
// export interface ExportEmphasisLocalConfig{
//     othersOpacity?:number|string
//     othersSaturationRatio?:number|string
// }

export const useExportLocalConfigStore = defineStore('exportLocalConfig',()=>{
    const fileNameStyle = ref<ExportFileNameStyle>('lineCount')
    const pixelRestrict = ref<string|number>('')
    const ads = ref<AdsRenderType>('no')

    const watermark = ref<ExportWatermarkLocalConfig>(waterMarkDefault())
    function waterMarkDefault():ExportWatermarkLocalConfig{
        return {
            enabled:false, enabledPreview:false, 
            text:'测试水印', fontSize:300, opacity:0.1, coverMode:'under',
            xDist:400, yDist:300, xOffset:400, rotate:0
        }
    }
    function watermarkReset(){
        const defaultVal = waterMarkDefault()
        watermark.value = defaultVal
        return defaultVal
    }

    //#region 旧版兼容性，过段时间删了
    function backCompat(){
        const legacyFileNameStyleKey = 'localConfig_export_exportFileNameStyle'
        const legacyFileNameStyle = localStorage.getItem(legacyFileNameStyleKey)
        if(legacyFileNameStyle){
            fileNameStyle.value = legacyFileNameStyle as ExportFileNameStyle    
        }
        localStorage.removeItem(legacyFileNameStyleKey) 

        const legacyPixelRestrictKey = 'localConfig_export_exportPixelRestrict'
        const legacyPixelRestrict = localStorage.getItem(legacyPixelRestrictKey)
        if(legacyPixelRestrict){
            pixelRestrict.value = legacyPixelRestrict
        }
        localStorage.removeItem(legacyPixelRestrictKey)

        const legacyAdsKey = 'localConfig_export_exportWithAds'
        const legacyAds = localStorage.getItem(legacyAdsKey)
        if(legacyAds){
            ads.value = legacyAds as AdsRenderType
        }
        localStorage.removeItem(legacyAdsKey)

        const legacyWatermarkJsonKey = 'localConfig_export_watermark'
        const legacyWatermarkJson = localStorage.getItem(legacyWatermarkJsonKey)
        try{
            if(legacyWatermarkJson){
                const legacyWatermark = JSON.parse(legacyWatermarkJson) as ExportWatermarkLocalConfig
                watermark.value = legacyWatermark 
            }
        }
        finally{
            localStorage.removeItem(legacyWatermarkJsonKey)
        }
    }
    //#endregion

    return {
        fileNameStyle,
        pixelRestrict,
        ads,
        watermark,
        watermarkReset,
        waterMarkDefault,

        backCompat
    }
},
{
    persist:{
        key: `${localConfigKeyPrefix}-export` 
    }
})