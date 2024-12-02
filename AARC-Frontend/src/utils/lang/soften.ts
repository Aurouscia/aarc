export function soften(num:number, by:number, base?:number){
    base = base || 1
    return base+(num-base)*by
}