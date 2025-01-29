export function indicesInArray<T>(array:Array<T>, target:T, isSame?:(a:T,b:T)=>boolean){
    const isSameF = isSame || ((a, b)=>a===b)
    const res:number[] = []
    for(let i=0; i<array.length; i++){
        const itemHere = array[i]
        if(isSameF(itemHere, target)){
            res.push(i)
        }
    }
    return res
}

export function indicesInArrayByPred<T>(array:Array<T>, match:(item:T)=>boolean){
    const res:number[] = []
    for(let i=0; i<array.length; i++){
        const itemHere = array[i]
        if(match(itemHere)){
            res.push(i)
        }
    }
    return res
}

export function removeAllByPred<T>(array:Array<T>, match:(item:T)=>boolean){
    const indices = indicesInArrayByPred<T>(array, match)
    removeAllByIndices(array, indices)
}

export function removeAllByIndices<T>(array:Array<T>, indices:number[]){
    indices.sort()
    for(let i = indices.length-1; i>=0; i--){
        array.splice(indices[i], 1)
    }
}