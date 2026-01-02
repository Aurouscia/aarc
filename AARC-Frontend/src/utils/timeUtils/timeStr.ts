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

export function toYMD(val:number|undefined){
    if(!val) return ''
    const d = new Date(val)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const date = d.getDate()
    return `${year}-${month}-${date}`
}

export function fromYMD(val:string|undefined, showErr?:(msg:string)=>void){
    if(!val) return undefined
    let [year, month, day] = val
        .split('-')
        .map(v => parseInt(v))
    month ??= 1
    day ??= 1
    if(isNaN(year) || isNaN(month) || isNaN(day)){
        if(showErr)
            showErr('日期格式异常')
        return undefined
    }
    let date
    try{
        date = new Date(year, month-1, day)
    }
    catch(e){
        if(showErr)
            showErr('日期格式异常')
        return undefined
    }
    return date.getTime()
}