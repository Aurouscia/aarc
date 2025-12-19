import { useExportLocalConfigStore } from "@/app/localConfig/exportLocalConfig";
import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";

export const useRenderOptionsStore = defineStore('renderOptions', ()=>{
    const exporting = ref<boolean>(false)

    const accentuationLineIds = ref<number[]>([])
    const accentuationEnabled = ref<boolean>(true)
    const { accentuation: accentuationConfig } = storeToRefs(useExportLocalConfigStore())
    return { 
        exporting,
        accentuationLineIds, accentuationEnabled, accentuationConfig
    }
})