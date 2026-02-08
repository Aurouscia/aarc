import { useConfigStore } from "@/models/stores/configStore";
import { defineStore, storeToRefs } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useSaveStore } from "@/models/stores/saveStore";
import { useBgRefImageStore } from "@/models/stores/saveDerived/bgRefImgStore";

export const useBgRefImageCvsWorker = defineStore('bgRefImageCvsWorker', () => {
    const cs = useConfigStore()
    const bgRefImageStore = useBgRefImageStore()
    const { cvsWidth, cvsHeight } = storeToRefs(useSaveStore())

    function renderBgRefImage(ctx: CvsContext) {
        const cfg = cs.config.bgRefImage
        const img = document.getElementById(bgRefImageStore.bgRefImageElementId)
        // 如果未设置“用于导出”，则不绘制背景图（否则未代理，是tainted）
        if (!cfg.export || !img || !(img instanceof HTMLImageElement))
            return
        const whRatio = img.naturalWidth / img.naturalHeight
        if (!whRatio || isNaN(whRatio))
            return
        let { width, height, left, right, top, bottom } = cfg

        if(!width && left && right){
            width = cvsWidth.value - left - right // 不指定宽，且有左右时，用左右算出
        }
        if(!height && top && bottom){
            height = cvsHeight.value - top - bottom
        }
        if(!width && height){
            width = height * whRatio // 宽依然未固定，且高固定，使用宽高比算出
        }
        if(!height && width){
            height = width / whRatio
        }

        if(!left && width && right){
            left = cvsWidth.value - width - right
        }
        if(!top && height && bottom){
            top = cvsHeight.value - height - bottom
        }
        left ??= 0
        width ??= cvsWidth.value
        top ??= 0
        height ??= cvsHeight.value
        let oriAlpha = ctx.globalAlpha
        ctx.globalAlpha = (cfg.opacity ?? 100) / 100
        ctx.drawImage(img, left, top, width, height)
        ctx.globalAlpha = oriAlpha
    }

    return {
        renderBgRefImage
    }
})