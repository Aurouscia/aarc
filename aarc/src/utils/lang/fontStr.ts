export function concatFontStr(font:string, fontSize:number){
    return `${fontSize}px ${font}`
}

export function convertLineSeppedToCommaSepped(fonts?: string){
    return fonts?.split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0)
        .map(f => f.includes(' ') ? `'${f}'` : f)
        .join(', ')
}