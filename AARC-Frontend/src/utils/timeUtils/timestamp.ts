export function timestampS(){
    return Math.round(timestampMS())
}

export function timestampMS(){
    return Date.now()
}