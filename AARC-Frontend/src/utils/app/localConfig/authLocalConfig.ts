import { defineStore } from "pinia";
import { LocalConfig } from "./common/localConfig";


const loginExpireHrsDefault = 7*24

class AuthLocalConfig extends LocalConfig{
    protected storageSectorName(): string {
        return 'auth'
    }
    private readonly loginExpireHrsKey = 'loginExpireHrs'
    readLoginExpireHrs(){
        return parseInt(this.readLocalConfig(this.loginExpireHrsKey)||'') || loginExpireHrsDefault
    }
    saveLoginExpireHrs(hrs:number){
        this.saveLocalConfig(this.loginExpireHrsKey, hrs.toString())
    }
}

export const useAuthLocalConfigStore = defineStore('authLocalConfig',()=>{
    const cfg = new AuthLocalConfig()
    return {
        readLoginExpireHrs: ()=>cfg.readLoginExpireHrs(),
        saveLoginExpireHrs: (hrs:number)=>cfg.saveLoginExpireHrs(hrs),
        loginExpireHrsDefault
    }
})