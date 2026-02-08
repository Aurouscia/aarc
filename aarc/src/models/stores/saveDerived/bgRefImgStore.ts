import { defineStore, storeToRefs } from "pinia";
import { computed, CSSProperties, ref, watch } from "vue";
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

    const preDisplayUrl = ref<string>()
    let urlAssignTimer = 0
    watch(()=>({
        url: configStore.config.bgRefImage.url,
        export: configStore.config.bgRefImage.export
    }), (newVal)=>{
        window.clearTimeout(urlAssignTimer)
        preDisplayUrl.value = undefined // 强制让图片消失并重新出现
        urlAssignTimer = window.setTimeout(()=>{
            preDisplayUrl.value = newVal.url
        }, 100)
    }, { immediate: true })

    const bgRefImageDisplayUrl = computed<string|undefined>(()=>{
        const cfg = configStore.config.bgRefImage
        const url = preDisplayUrl.value
        if(!url) return undefined
        if(!cfg.export)
            return url
        return convertToProxyUrlIfNeeded(url, 'icon')
    })

    const bgRefImageElementId = ref('bgRefImage')

    return {
        bgRefImageStyle,
        bgRefImageDisplayUrl,
        bgRefImageElementId
    }
})