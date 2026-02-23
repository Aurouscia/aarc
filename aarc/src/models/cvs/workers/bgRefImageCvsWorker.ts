import { useConfigStore } from "@/models/stores/configStore";
import { defineStore, storeToRefs } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useSaveStore } from "@/models/stores/saveStore";
import { useBgRefImageStore } from "@/models/stores/saveDerived/bgRefImgStore";
import { calcBgImageLayout } from "@/utils/layout/calcBgImageLayout";

export const useBgRefImageCvsWorker = defineStore('bgRefImageCvsWorker', () => {
    const cs = useConfigStore()
    const bgRefImageStore = useBgRefImageStore()
    const { cvsWidth, cvsHeight } = storeToRefs(useSaveStore())

    function renderBgRefImage(ctx: CvsContext) {
        const cfg = cs.config.bgRefImage
        const img = document.getElementById(bgRefImageStore.bgRefImageElementId)
        // 如果未设置"用于导出"，则不绘制背景图（否则未代理，是tainted）
        if (!cfg.export || !img || !(img instanceof HTMLImageElement))
            return
        const layout = calcBgImageLayout(
            cfg,
            cvsWidth.value,
            cvsHeight.value,
            img.naturalWidth,
            img.naturalHeight
        )
        if (!layout)
            return
        const { left, top, width, height, opacity } = layout
        let oriAlpha = ctx.globalAlpha
        ctx.globalAlpha = opacity
        ctx.drawImage(img, left, top, width, height)
        ctx.globalAlpha = oriAlpha
    }

    return {
        renderBgRefImage
    }
})
