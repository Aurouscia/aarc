export function useKvStoreCore<TValue>(){
    const items:Map<number, TValue> = new Map()
    function getItem(id:number){
        return items.get(id)
    }
    function setItem(id:number, value:TValue|undefined){
        if(value !== undefined){
            items.set(id, value)
        }else{
            items.delete(id)
        }
    }
    function enumerateItems(fn:(id:number, value:TValue)=>boolean|undefined|void){
        for(const [id, value] of items){
            const enough = fn(id, value)
            if(enough)
                break
        }
    }
    function clearItems(){
        items.clear();
    }
    return { getItem, setItem, enumerateItems, clearItems }
}