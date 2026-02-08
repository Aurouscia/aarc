export function moveUpInArray<T>(array:T[]|undefined, moveUpIdx:number){
    if(!array || moveUpIdx<=0 || moveUpIdx>=array.length){
        return
    }
    let temp = array[moveUpIdx]
    array[moveUpIdx] = array[moveUpIdx-1]
    array[moveUpIdx-1] = temp
}

export function moveUpInArrayByPred<T>(array:T[], predicate:(item:T)=>boolean){
    const idx = array.findIndex(predicate)
    moveUpInArray(array, idx)
}