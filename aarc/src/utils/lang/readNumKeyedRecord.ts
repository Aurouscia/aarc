import { isZero } from "../sgn"

export function readNumKeyedRecord<T>(record:Record<string, T>, readKey:number){
    const keys = Object.keys(record)
    for(const key of keys){
        const keyNum = parseFloat(key)
        if(isZero(keyNum - readKey)){
            return record[key]
        }
    }
}