export function useKvStoreCore<TValue>(){
    const items:Record<number, TValue|undefined> = {}
    function getItem(id:number){
        return items[id]
    }
    function setItem(id:number, value:TValue|undefined){
        if(value !== undefined){
            items[id] = value
        }else{
            delete items[id]
        }
    }
    function enumerateItems(fn:(id:number, value:TValue)=>boolean|undefined|void){
        for(let kv of Object.entries(items)){
            const id = parseInt(kv[0])
            const value = kv[1]
            if(value !== undefined){
                const enough = fn(id, value)
                if(enough)
                    break
            }
        }
    }
    function clearItems(){
        for (let key in items) {
            if (items.hasOwnProperty(key)) {
                delete items[key];
            }
        }
    }
    return { getItem, setItem, enumerateItems, clearItems }
}