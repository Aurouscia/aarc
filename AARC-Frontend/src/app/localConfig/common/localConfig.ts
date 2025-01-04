export abstract class LocalConfig{
    protected abstract storageSectorName():string
    protected storageKey = (k:string) => `localConfig_${this.storageSectorName()}_${k}`
    readLocalConfig(key:string){
        return localStorage.getItem(this.storageKey(key))
    }

    saveLocalConfig(key:string, value:string){
        localStorage.setItem(this.storageKey(key), value);
    }
}