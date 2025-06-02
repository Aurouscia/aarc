import { defineStore } from "pinia";
import { LocalConfig } from "./common/localConfig";
import { ref } from "vue";

class EditorLocalConfig extends LocalConfig{
    protected storageSectorName() { return 'editor'}
    private readonly staNameFobKey = 'staNameFob'
    readStaNameFob(){
        return parseFloat(this.readLocalConfig(this.staNameFobKey) || '') || 0
    }
    saveStaNameFob(fob:number|string){
        if(typeof fob === 'string')
            fob = parseFloat(fob) || 0
        if(fob < 0)
            fob = 0
        this.saveLocalConfig(this.staNameFobKey, fob.toString())
        return fob
    }
}

export const useEditorLocalConfigStore = defineStore('editorLocalConfig',()=>{
    const cfg = new EditorLocalConfig()
    const staNameFob = ref(cfg.readStaNameFob())
    return {
        staNameFob,
        readStaNameFob: ()=>cfg.readStaNameFob(),
        saveStaNameFob: (fob:number|string)=>{staNameFob.value = cfg.saveStaNameFob(fob)}
    }
})