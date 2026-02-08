export function clamp(num:number, lowerBound:number, upperBound:number){
    if(num<lowerBound)
        return lowerBound
    if(num>upperBound)
        return upperBound
    return num
}