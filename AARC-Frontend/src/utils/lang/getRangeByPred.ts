export function getRangeByPred<T>(array:Array<T>, pred:(item:T)=>boolean){
    let found = false
    let first = 0
    for(let i=0;i<array.length;i++){
        const item = array[i]
        const match = pred(item)
        if(match && !found){
            first = i
            found = true
        }
        if(!match && found){
            return {
                first,
                last: i-1
            }
        }
    }
    if(found){
        return {
            first,
            last: array.length-1
        }
    }
}