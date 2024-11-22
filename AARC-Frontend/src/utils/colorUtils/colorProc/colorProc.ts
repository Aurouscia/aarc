export abstract class ColorProcBase{
    private cache: Record<string, string|undefined>
    constructor(){
        this.cache = {}
    }
    convert(inputColor:string){
        const cached = this.cache[inputColor]
        if(cached)
            return cached
        const res = this.convertColor(inputColor)
        this.cache[inputColor] = res
        return res
    }
    protected abstract convertColor(inputColor:string):string
}