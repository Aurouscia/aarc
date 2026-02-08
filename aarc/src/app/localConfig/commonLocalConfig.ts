import { defineStore } from "pinia"
import { ref } from "vue"
import { localConfigKeyPrefix } from "./common/keyPrefix"

export const useCommonLocalConfigStore = defineStore('commonLocalConfig',()=>{
    const showFaqOnTopbar = ref(true)
    return {
        showFaqOnTopbar
    }
},
{
    persist:{
        key: `${localConfigKeyPrefix}-common`
    }
})