const simpleGridSpace = 100;
export function simpleGrid(ctx:CanvasRenderingContext2D){
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const vertLineCount = w/simpleGridSpace+1;
    const horiLineCount = h/simpleGridSpace+1;
    ctx.lineWidth = 1
    ctx.strokeStyle = '#999'
    ctx.beginPath()
    for(let i=0;i<vertLineCount;i++){
        const x = i*simpleGridSpace
        ctx.moveTo(x,0)
        ctx.lineTo(x,h)
    }
    for(let i=0;i<horiLineCount;i++){
        const y = i*simpleGridSpace
        ctx.moveTo(0,y)
        ctx.lineTo(w,y)
    }
    ctx.stroke()
}