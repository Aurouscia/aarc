import { defineStore, storeToRefs } from "pinia";
import { computed, CSSProperties, nextTick, ref, watch } from "vue";
import { useConfigStore } from "../configStore";
import { useSaveStore } from "../saveStore";
import { convertToProxyUrlIfNeeded } from "@/utils/urlUtils/proxyUrl";
import { calcBgImageLayout } from "@/utils/layout/calcBgImageLayout";

export const useBgRefImageStore = defineStore('bgRefImage', ()=>{
    const configStore = useConfigStore()
    const { cvsWidth, cvsHeight } = storeToRefs(useSaveStore())

    const bgRefImageElementId = ref('bgRefImage')

    // 图片尺寸 ref，用于触发 computed 重新计算
    const imgNaturalWidth = ref(0)
    const imgNaturalHeight = ref(0)

    // 计算布局（左、上、宽、高、透明度）
    const bgRefImageLayout = computed(()=>{
        const cfg = configStore.config.bgRefImage
        // 依赖图片尺寸 ref，确保加载完成后重新计算
        const nw = imgNaturalWidth.value
        const nh = imgNaturalHeight.value
        if(!nw || !nh) return undefined
        return calcBgImageLayout(
            cfg,
            cvsWidth.value,
            cvsHeight.value,
            nw,
            nh
        )
    })

    // 基于布局计算 CSS 样式（使用百分比以适应容器缩放）
    const bgRefImageStyle = computed<CSSProperties>(()=>{
        const layout = bgRefImageLayout.value
        if(!layout) return { position: 'absolute' }
        const { left, top, width, height, opacity } = layout
        return {
            position: 'absolute',
            left: `${left/cvsWidth.value*100}%`,
            top: `${top/cvsHeight.value*100}%`,
            width: `${width/cvsWidth.value*100}%`,
            height: `${height/cvsHeight.value*100}%`,
            opacity: opacity.toString()
        }
    })

    const preDisplayUrl = ref<string>()
    let urlAssignTimer = 0
    watch(()=>({
        url: configStore.config.bgRefImage.url,
        export: configStore.config.bgRefImage.export
    }), (newVal)=>{
        window.clearTimeout(urlAssignTimer)
        preDisplayUrl.value = undefined // 强制让图片消失并重新出现
        imgNaturalWidth.value = 0
        imgNaturalHeight.value = 0
        urlAssignTimer = window.setTimeout(async ()=>{
            preDisplayUrl.value = newVal.url
            // 为 img 元素添加 onload 监听
            if(newVal.url){
                await nextTick() // 等待 DOM 更新，img 元素渲染完成
                const img = document.getElementById(bgRefImageElementId.value)
                if(img && img instanceof HTMLImageElement){
                    img.onload = ()=>{
                        imgNaturalWidth.value = img.naturalWidth
                        imgNaturalHeight.value = img.naturalHeight
                    }
                    // 如果图片已经缓存，onload 可能不会触发，需要手动检查
                    if(img.complete && img.naturalWidth){
                        imgNaturalWidth.value = img.naturalWidth
                        imgNaturalHeight.value = img.naturalHeight
                    }
                    // 注：无需清理 onload，因为每次 url 变化时 preDisplayUrl 会先置空，
                    // 导致 img 元素被移除（v-if/v-show 控制），元素销毁后监听自动失效，不会有内存泄漏
                }
            }
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

    return {
        bgRefImageStyle,
        bgRefImageDisplayUrl,
        bgRefImageElementId
    }
})
