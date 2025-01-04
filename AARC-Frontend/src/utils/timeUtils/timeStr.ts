export function timeStr(type:'date'|'dateTime'){
    const t = new Date()
    const year = (t.getFullYear() % 100).toString()
    const month = pad(t.getMonth()+1)
    const day = pad(t.getDate())
    const date = `${year}${month}${day}`
    if(type === 'date')
        return date
    const hour = pad(t.getHours())
    const min = pad(t.getMinutes())
    return `${date}-${hour}${min}`
}

function pad(num:number){
    return num.toString().padStart(2, '0')
}