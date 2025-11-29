import Bowser from "bowser"
import { defineStore } from "pinia"
import { computed, ref } from "vue"

export const useBrowserInfoStore = defineStore('browserInfo',()=>{
    const ua = window.navigator.userAgent
    const browserInfo = ref<ReturnType<typeof Bowser.parse>>(Bowser.parse(ua))
    const isWebkit = computed<boolean>(()=>browserInfo.value?.engine.name?.toLowerCase()=='webkit')
    const isWindows = computed<boolean>(()=>browserInfo.value?.os.name?.toLowerCase()=='windows')
    const isIPhoneOrIPad = computed<boolean>(()=>{
        const vendor = browserInfo.value.platform.vendor ?? ''
        const type = browserInfo.value.platform.type ?? ''
        const isApple = vendor.toLowerCase().includes('apple')
        const isMobile = type.toLowerCase().includes('mobile')
        const isTablet = type.toLowerCase().includes('tablet')
        return isApple && (isMobile || isTablet)
    })
    const isBaiduApp = ua.includes('baiduboxapp')
    const isQQBuiltIn = ua.includes(' QQ/')
    const isWxBuiltIn = ua.includes('MicroMessenger')
    return {
        browserInfo,
        isWebkit,
        isWindows,
        isIPhoneOrIPad,
        ua,
        isBaiduApp,
        isQQBuiltIn,
        isWxBuiltIn
    }
})