export function removeKeyIfSame(target:any, source:any){
    const keys = Object.keys(target)
    for(const key of keys){
        if(key in target && key in source){
            if(target[key] === source[key])
                delete target[key]
        }
    }
}