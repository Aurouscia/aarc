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