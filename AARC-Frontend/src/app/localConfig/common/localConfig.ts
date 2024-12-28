export abstract class LocalConfig{
    protected abstract storageSectorName():string
    protected storageKey = (k:string) => `localConfig_${this.storageSectorName()}_${k}`
    protected readLocalConfig(key:string){
        return localStorage.getItem(this.storageKey(key))
    }

    protected saveLocalConfig(key:string, value:string){
        localStorage.setItem(this.storageKey(key), value);
    }
}