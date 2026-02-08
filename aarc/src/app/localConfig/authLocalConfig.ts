import { defineStore } from "pinia";
import { ref } from "vue";
import { localConfigKeyPrefix } from "./common/keyPrefix";


export const loginExpireHrsDefault = 30*24

export const useAuthLocalConfigStore = defineStore('authLocalConfig',()=>{
    const loginExpireHrs = ref(loginExpireHrsDefault)

    function backCompat(){
        const legacyKey = 'localConfig_auth_loginExpireHrs'
        const legacyVal = localStorage.getItem(legacyKey)
        if(legacyVal){
            loginExpireHrs.value = Number(legacyVal) || loginExpireHrsDefault
        }
        localStorage.removeItem(legacyKey)
    }

    return {
        loginExpireHrs,

        backCompat
    }
},
{
    persist:{
        key: `${localConfigKeyPrefix}-auth`
    }
})