import { defineStore } from "pinia";
import { LocalConfig } from "./common/localConfig";
//import { useBrowserInfoStore } from "../globalStores/browserInfo";
import { ref } from "vue";

export type ResolutionType = 'standard'|'high'|'ultra'
class EditorLocalConfig extends LocalConfig{
    protected storageSectorName() { return 'editor'}
    private readonly resolutionKey = 'resolution'
    readResolution(){
        return this.readLocalConfig(this.resolutionKey) as ResolutionType|null
    }
    saveResolution(rtype:ResolutionType|null){
        rtype = rtype||'standard'
        this.saveLocalConfig(this.resolutionKey, rtype)
    }
}

export const useEditorLocalConfigStore = defineStore('editorLocalConfig',()=>{
    //const browserInfoStore = useBrowserInfoStore()
    const cfg = new EditorLocalConfig()
    const resolution = ref(readResolution())
    function readResolution(){
        let readRes = cfg.readResolution()
        // if(!readRes){
        //     readRes = browserInfoStore.isWindows ? 'high':'standard'  //windows下默认高分辨率写入
        //     cfg.saveResolution(readRes)
        // }
        return readRes || 'standard'
    }
    return {
        readResolution,
        saveResolution:()=>cfg.saveResolution(resolution.value),
        resolution
    }
})