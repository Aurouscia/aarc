/**
 * 用换行符split，并逐个trim，只保留非空行
 * @param str 要处理的字符串
 */
export function splitLinesClean(str?:string){
    if(!str)
        return []
    const splitted = str.split('\n')
    const res:string[] = []
    for(const line of splitted){
        const trimmedLine = line.trim()
        if(trimmedLine)
            res.push(trimmedLine)
    }
    return res
}