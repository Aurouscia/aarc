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

export function pullAllByPred<T>(array:Array<T>, match:(item:T)=>boolean){
    const indices = indicesInArrayByPred<T>(array, match)
    const res:T[] = []
    for(let i = indices.length-1; i>=0; i--){
        const item = array.splice(indices[i], 1)[0]
        res.unshift(item)
    }
    return res
}

// export function pullAllByPred<T>(array:Array<T>, match:(item:T)=>boolean){
//     const indices = new Set<number>(indicesInArrayByPred<T>(array, match))
//     const pulled:T[] = []
//     const newArray:T[] = []
//     for(let i = 0; i < array.length; i++){
//         if(indices.has(i)){
//             pulled.push(array[i])
//         }else{
//             newArray.push(array[i])
//         }
//     }
//     array.length = 0
//     array.push(...newArray)
//     return pulled
// }