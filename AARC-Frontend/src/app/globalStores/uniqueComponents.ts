import { BoxType, PopCallback } from "@/components/common/types/pop";
import { WaitCallback } from "@/components/common/types/wait";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useUniqueComponentsStore = defineStore('uniqueComponents', ()=>{
    const popCallback = ref<PopCallback>()
    const waitCallback = ref<WaitCallback>()
    const topbarShow = ref<boolean>(true)

    function initCallbacks(callbacks: {
        popCallback: PopCallback,
        waitCallback: WaitCallback
    }){
        popCallback.value = callbacks.popCallback
        waitCallback.value = callbacks.waitCallback
    }

    function showPop(msg: string, type: BoxType){
        if(popCallback.value){
            popCallback.value(msg, type)
        }
    }
    function showWait(reason: string, flag: boolean){
        if(waitCallback.value){
            waitCallback.value(reason, flag)
        }
    }

    return { initCallbacks, topbarShow, showPop, showWait }
})