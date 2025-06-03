export function removeKeyIfSame(target:any, source:any){
    //注意：修改removeKeyIfSame前，关注makeSureCompatibilityWhenReading的逻辑
    const keys = Object.keys(target)
    for(const key of keys){
        if(key in target && key in source){
            if(target[key] === source[key])
                delete target[key]
        }
    }
}