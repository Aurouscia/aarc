export function timestampS(){
    return Math.round(timestampMS()/1000)
}

export function timestampMS(){
    return Date.now()
}