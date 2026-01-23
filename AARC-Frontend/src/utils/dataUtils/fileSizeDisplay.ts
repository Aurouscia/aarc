export function fileSizeDisplay(byteCount:number){
    if(byteCount < 1024){
        return byteCount + "B";
    }
    let kbCount = byteCount / 1024;
    if(kbCount < 1024){
        return kbCount.toFixed(fracDigits(kbCount)) + "KB";
    }
    let mbCount = kbCount / 1024;
    if(mbCount < 1024){
        return mbCount.toFixed(fracDigits(mbCount)) + "MB";
    }
    let gbCount = mbCount / 1024;
    return gbCount.toFixed(fracDigits(gbCount)) + "GB";
}

function fracDigits(num: number){
    const isCloseToInteger = Math.abs(num - Math.round(num)) < Number.EPSILON;
    if(num < 10 && !isCloseToInteger){
        return 1;
    }
    return 0;
}