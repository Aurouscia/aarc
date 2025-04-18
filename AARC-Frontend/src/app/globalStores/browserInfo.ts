import Bowser from "bowser"
import { defineStore } from "pinia"
import { computed, ref } from "vue"

export const useBrowserInfoStore = defineStore('browserInfo',()=>{
    const browserInfo = ref<ReturnType<typeof Bowser.parse>>(Bowser.parse(window.navigator.userAgent))
    const isWebkit = computed<boolean>(()=>browserInfo.value?.engine.name?.toLowerCase()=='webkit')
    const isWindows = computed<boolean>(()=>browserInfo.value?.os.name?.toLowerCase()=='windows')
    return {
        browserInfo,
        isWebkit,
        isWindows
    }
})