import { defineStore, storeToRefs } from "pinia";
import { computed, CSSProperties } from "vue";
import { useConfigStore } from "../configStore";
import { useSaveStore } from "../saveStore";
import { convertToProxyUrlIfNeeded } from "@/utils/urlUtils/proxyUrl";

export const useBgRefImageStore = defineStore('bgRefImage', ()=>{
    const configStore = useConfigStore()
    const { cvsWidth, cvsHeight } = storeToRefs(useSaveStore())
    const bgRefImageStyle = computed<CSSProperties>(()=>{
        const bgRefImage = configStore.config.bgRefImage
        const opacityNum = bgRefImage.opacity ? parseInt(bgRefImage.opacity.toString()) : NaN
        const res:CSSProperties = {
            position: 'absolute',
            opacity: !isNaN(opacityNum) ? `${opacityNum/100}` : undefined,
        }
        if(typeof bgRefImage.left === 'number'){
            res.left = `${bgRefImage.left/cvsWidth.value*100}%`
        }
        if(typeof bgRefImage.right === 'number'){
            res.right = `${bgRefImage.right/cvsWidth.value*100}%`
        }
        if(typeof bgRefImage.top === 'number'){
            res.top = `${bgRefImage.top/cvsHeight.value*100}%`
        }
        if(typeof bgRefImage.bottom === 'number'){
            res.bottom = `${bgRefImage.bottom/cvsHeight.value*100}%`
        }
        if(typeof bgRefImage.width === 'number'){
            res.width = `${bgRefImage.width/cvsWidth.value*100}%`
        }
        if(typeof bgRefImage.height === 'number'){
            res.height = `${bgRefImage.height/cvsHeight.value*100}%`
        }
        return res
    })

    const bgRefImageDisplayUrl = computed<string|undefined>(()=>{
        const cfg = configStore.config.bgRefImage
        const url = cfg.url
        if(!url) return undefined
        if(!cfg.export)
            return url
        return convertToProxyUrlIfNeeded(url, 'icon')
    })

    return {
        bgRefImageStyle,
        bgRefImageDisplayUrl
    }
})