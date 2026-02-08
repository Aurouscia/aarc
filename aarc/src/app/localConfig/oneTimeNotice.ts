import { defineStore } from "pinia";
import { ref } from "vue";
import { localConfigKeyPrefix } from "./common/keyPrefix";

export const useOneTimeNoticeStore = defineStore('oneTimeNotice', () => {
    const dontUseWeirdBrowserShown = ref(false)
    return{
        dontUseWeirdBrowserShown
    }
},{
    persist: {
        key: `${localConfigKeyPrefix}-oneTimeNotice`
    }
})