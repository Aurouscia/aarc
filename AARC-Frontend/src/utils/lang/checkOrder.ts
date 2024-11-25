export function checkOrder<T>(array:Array<T>, order:'asc'|'desc', orderBy:(item:T)=>number){
    if(array.length<=1)
        return true
    const check:(a:number,b:number)=>boolean
         = order=='asc' ? (a,b) => b>=a : (a,b) => b<=a
    for(let i=0; i<array.length-2; i++){
        const a = array[i]
        const b = array[i+1]
        const aBy = orderBy(a)
        const bBy = orderBy(b)
        return check(aBy, bBy)
    }
}