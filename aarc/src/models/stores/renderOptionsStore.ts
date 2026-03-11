import { useExportLocalConfigStore } from "@/app/localConfig/exportLocalConfig";
import { defineStore, storeToRefs } from "pinia";
import { computed, ref } from "vue";

export const useRenderOptionsStore = defineStore('renderOptions', ()=>{
    const exporting = ref<boolean>(false)

    const bgOpacity = ref<number>(1)

    const accentuationLineIds = ref<number[]>([])
    const accentuationEnabled = ref<boolean>(true)
    const { accentuation: accentuationConfig } = storeToRefs(useExportLocalConfigStore())

    const timeMoment = ref<number>()
    const timeMomentStr = ref<string>()
    const { time: timeConfig } = storeToRefs(useExportLocalConfigStore())

    // 临时时间覆盖值（用于APNG导出等场景，不影响用户设置）
    const timeMomentOverride = ref<number>()
    
    // 实际使用的时间（优先使用覆盖值）
    const effectiveTimeMoment = computed(() => 
        timeMomentOverride.value ?? timeMoment.value
    )
    
    /**
     * 设置临时时间覆盖值
     * @param value 覆盖值，传入 undefined 清除覆盖
     */
    function setTimeMomentOverride(value?: number) {
        timeMomentOverride.value = value
    }

    return { 
        exporting, bgOpacity,
        accentuationLineIds, accentuationEnabled, accentuationConfig,
        timeMoment, timeMomentStr, timeConfig,
        timeMomentOverride, effectiveTimeMoment, setTimeMomentOverride
    }
})