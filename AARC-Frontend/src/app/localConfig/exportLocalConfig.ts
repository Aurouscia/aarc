import { defineStore } from "pinia";
import { LocalConfig } from "./common/localConfig";

class ExportLocalConfig extends LocalConfig{
    protected storageSectorName() { return 'export'}
}

export const useExportLocalConfigStore = defineStore('exportLocalConfig',()=>{
    const exportFileNameStyleKey = 'exportFileNameStyle'
    const cfg = new ExportLocalConfig()
    return {
        readExportFileNameStyle: ()=>cfg.readLocalConfig(exportFileNameStyleKey),
        saveExportFileNameStyle: (style:string)=>cfg.saveLocalConfig(exportFileNameStyleKey, style)
    }
})