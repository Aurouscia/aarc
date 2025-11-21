import Bowser from "bowser"
import { defineStore } from "pinia"
import { computed, ref } from "vue"

export const useBrowserInfoStore = defineStore('browserInfo',()=>{
    const ua = window.navigator.userAgent
    const browserInfo = ref<ReturnType<typeof Bowser.parse>>(Bowser.parse(ua))
    const isWebkit = computed<boolean>(()=>browserInfo.value?.engine.name?.toLowerCase()=='webkit')
    const isWindows = computed<boolean>(()=>browserInfo.value?.os.name?.toLowerCase()=='windows')
    const isBaiduApp = ua.includes('baiduboxapp')
    const isQQBuiltIn = ua.includes(' QQ/')
    return {
        browserInfo,
        isWebkit,
        isWindows,
        ua,
        isBaiduApp,
        isQQBuiltIn
    }
})