const _1k = 1000
const _1m = _1k*1000
const _1g = _1m*1000
export function dataSizeStr(bytes:number){
    if(bytes<_1k)
        return bytes+"B";
    if(bytes<_1m)
        return (bytes/_1k).toFixed(1)+"K";
    if(bytes<_1g) 
        return (bytes/(_1m)).toFixed(1)+"M"
    return (bytes/(_1g)).toFixed(2)+"G"
}