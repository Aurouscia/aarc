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
    const fileFormat = ref<'png'|'webp'|'jpeg'>('png')
    const fileQuality = ref(1)
    const pixelRestrict = ref<string|number>('')
    const pixelRestrictMode = ref<'max'|'exact'>('max')
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

    return {
        fileNameStyle,
        fileFormat,
        fileQuality,
        pixelRestrict,
        pixelRestrictMode,
        ads,
        watermark,
        watermarkReset,
        waterMarkDefault
    }
},
{
    persist:{
        key: `${localConfigKeyPrefix}-export` 
    }
})