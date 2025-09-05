export abstract class ColorProcBase{
    private cache: Record<string, string|undefined>
    constructor(){
        this.cache = {}
    }
    convert(inputColor:string|undefined){
        if(!inputColor)
            return '#000000'
        const cached = this.cache[inputColor]
        if(cached)
            return cached
        const res = this.convertColor(inputColor)
        this.cache[inputColor] = res
        return res
    }
    convertNoCache(inputColor:string|undefined){
        if(!inputColor)
            return '#000000'
        return this.convertColor(inputColor)
    }
    protected abstract convertColor(inputColor:string):string
}