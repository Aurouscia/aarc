import { useExportLocalConfigStore } from "@/app/localConfig/exportLocalConfig";
import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";

export const useRenderOptionsStore = defineStore('renderOptions', ()=>{
    const accentuationLineIds = ref<number[]>([])
    const accentuationEnabled = ref<boolean>(false)
    const { accentuation: accentuationConfig } = storeToRefs(useExportLocalConfigStore())
    return { 
        accentuationLineIds, accentuationEnabled, accentuationConfig
    }
})