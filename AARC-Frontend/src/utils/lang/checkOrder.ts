export function checkOrder<T>(array:Array<T>, order:'asc'|'desc', orderBy:(item:T)=>number){
    if(array.length<=1)
        return true
    const check:(a:number,b:number)=>boolean
         = order=='asc' ? (a,b) => b>=a : (a,b) => b<=a
    const orderBys = array.map(x=>orderBy(x))
    for(let i=0; i<=array.length-2; i++){
        const a = orderBys[i]
        const b = orderBys[i+1]
        return check(a, b)
    }
}