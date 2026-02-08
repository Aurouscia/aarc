export function concatFontStr(font:string, fontSize:number){
    return `${fontSize}px ${font}`
}

export function convertLineSeppedToCommaSepped(fonts?: string){
    return fonts?.split('\n').join(', ')
}