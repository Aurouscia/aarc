export function soften(num:number, by:number, base?:number){
    base = base || 0
    return base+(num-base)*by
}