import { defineStore } from "pinia";
import { LocalConfig } from "./common/localConfig";
import { ref } from "vue";

class ScalerLocalConfig extends LocalConfig{
    protected storageSectorName() { return 'scaler'}
    private readonly steppedScaleEnabledKey = 'enableSteppedScale'
    readSteppedScaleEnabled(){
        return this.readLocalConfig(this.steppedScaleEnabledKey) === 'true'
    }
    saveSteppedScaleEnabled(enabled:boolean){
        this.saveLocalConfig(this.steppedScaleEnabledKey, String(enabled))
    }
}

export const useScalerLocalConfigStore = defineStore('authScalerConfig',()=>{
    const cfg = new ScalerLocalConfig()
    const steppedScaleEnabled = ref(false)
    steppedScaleEnabled.value = cfg.readSteppedScaleEnabled()
    return {
        readSteppedScaleEnabled: ()=>cfg.readSteppedScaleEnabled(),
        saveSteppedScaleEnabled: (enabled:boolean)=>{
            cfg.saveSteppedScaleEnabled(enabled)
            steppedScaleEnabled.value = enabled
        },
        steppedScaleEnabled
    }
})