import { TextMetricsSelected } from "@/utils/type/TextMetricsSelected";
import { Ref } from "vue";

export class CvsBlock{
    scale:number
    x:number
    y:number
    ctx2d:CanvasRenderingContext2D
    constructor(scale:number, x:number, y:number, ctx2d:CanvasRenderingContext2D){
        this.scale = scale
        this.x = x
        this.y = y
        this.ctx2d = ctx2d
    }
    mapX(x:number){ return x * this.scale - this.x }
    mapY(y:number){ return y * this.scale - this.y }
}

export class CvsContext{
    private blocks:Ref<CvsBlock[]>
    constructor(blocks:Ref<CvsBlock[]>){
        this.blocks = blocks
    }

    enumerate(func:(b:CvsBlock)=>void){
        this.blocks.value.forEach(func)
    }
    callMethod(method:'beginPath'|'closePath'|'stroke'|'fill'){
        this.enumerate(b=>b.ctx2d[method]())
    }
    callMethodXY(method:'moveTo'|'lineTo', x:number, y:number){
        this.enumerate(b=>b.ctx2d[method](b.mapX(x), b.mapY(y)))
    }
    callMethodXYWH(method:'strokeRect'|'fillRect', x:number, y:number, width:number, height:number){
        this.enumerate(b=>b.ctx2d[method](b.mapX(x), b.mapY(y), width*b.scale, height*b.scale))
    }
    beginPath(){this.callMethod('beginPath')}
    closePath(){this.callMethod('closePath')}
    moveTo(x:number, y:number){this.callMethodXY('moveTo', x, y)}
    lineTo(x:number, y:number){this.callMethodXY('lineTo', x, y)}
    stroke(){this.callMethod('stroke')}
    fill(){this.callMethod('fill')}
    strokeRect(x:number, y:number, width:number, height:number)
        {this.callMethodXYWH('strokeRect', x, y, width, height)}
    fillRect(x:number, y:number, width:number, height:number)
        {this.callMethodXYWH('fillRect', x, y, width, height)}
    arc(x:number, y:number, radius:number, startAngle:number, endAngle:number, counterClockwise?:boolean){
        this.enumerate(b=>
            b.ctx2d.arc(b.mapX(x), b.mapY(y), radius*b.scale, startAngle, endAngle, counterClockwise))
    }
    strokeText(text:string, x:number, y:number){
        this.enumerate(b=>
            b.ctx2d.strokeText(text, b.mapX(x), b.mapY(y)))
    }
    fillText(text:string, x:number, y:number){
        this.enumerate(b=>
            b.ctx2d.fillText(text, b.mapX(x), b.mapY(y)))
    }
    measureText(text:string):TextMetricsSelected{
        const sample = this.blocks.value.at(0)
        const m = sample?.ctx2d.measureText(text)
        const scale = sample?.scale || 1
        if(m)
            return {
                width: m.width / scale,
                actualBoundingBoxAscent: m.actualBoundingBoxAscent / scale,
                actualBoundingBoxDescent: m.actualBoundingBoxDescent / scale
            }
        else{
            return {
                width: 0,
                actualBoundingBoxAscent:0,
                actualBoundingBoxDescent:0
            }
        }
    }
    clear(){
        this.enumerate(b=>{
            const cvs = b.ctx2d.canvas
            b.ctx2d.clearRect(0, 0, cvs.width, cvs.height)
        })
    }

    set lineJoin(value:CanvasLineJoin){
        this.enumerate(b=>b.ctx2d.lineJoin = value)}
    set lineCap(value:CanvasLineCap){
        this.enumerate(b=>b.ctx2d.lineCap = value)}
    set lineWidth(value:number){
        this.enumerate(b=>b.ctx2d.lineWidth = value*b.scale)}
    set strokeStyle(value:string){
        this.enumerate(b=>b.ctx2d.strokeStyle = value)}
    set fillStyle(value:string){
        this.enumerate(b=>b.ctx2d.fillStyle = value)}
    set globalAlpha(value:number){
        this.enumerate(b=>b.ctx2d.globalAlpha = value)}
    set textBaseline(value:CanvasTextBaseline){
        this.enumerate(b=>b.ctx2d.textBaseline = value)}
    set textAlign(value:CanvasTextAlign){
        this.enumerate(b=>b.ctx2d.textAlign = value)}
    set font(value:{fontSize:number, font:string}){
        this.enumerate(b=>b.ctx2d.font = `${value.fontSize*b.scale}px ${value.font}`)}
}