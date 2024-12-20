export function timestampS(){
    return Math.round(timestampMS())
}

export function timestampMS(){
    return (new Date()).getTime()
}