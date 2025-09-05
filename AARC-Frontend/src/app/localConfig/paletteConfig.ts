import { defineStore } from "pinia";
import { ref } from "vue";
import { localConfigKeyPrefix } from "./common/keyPrefix";

export const usePaletteLocalConfigStore = defineStore('paletteLocalConfig',()=>{
    const strictMode = ref<boolean>(false)
    const subnameMode = ref<boolean>(false)
    const favoriteNames = ref<string[]>([])
    return {
        strictMode,
        subnameMode,
        favoriteNames
    }
},
{
    persist:{
        key: `${localConfigKeyPrefix}-palette`
    }
})