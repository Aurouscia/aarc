import { defineStore, storeToRefs } from "pinia";
import { useSaveStore } from "./saveStore";
import { CvsBlock, CvsContext } from "../cvs/common/cvsContext";
import { Coord } from "../coord";

export const usePatternStore = defineStore('pattern', ()=>{
    // 不要去读saveStore（非常大且与本功能无关），读src/models/save.ts中的interface Pattern即可
    const { save } = storeToRefs(useSaveStore())

    function getRendered(id:number, scale:number, offset:[number, number], color?:string, opacity?:number){
        const p = save.value?.patterns?.find(x=>x.id == id)
        if(!p) 
            return
        // 由于canvas边长必须为整数，但我们必须生成边长任意的pattern，只能画一个更大的canvas再取整，以降低误差
        let enlarge = Math.round(250 / Math.min(p.width, p.height))
        const cvsWidth = Math.round(p.width * scale * enlarge)
        const cvsHeight = Math.round(p.height * scale * enlarge)
        offset[0] = offset[0]/scale % p.width
        offset[1] = offset[1]/scale % p.height
        console.log({enlarge, cvsWidth, cvsHeight})
        const offc = new OffscreenCanvas(cvsWidth, cvsHeight)
        const offcCtx = offc.getContext('2d')!
        const ctx = new CvsContext(new CvsBlock(scale, 0, 0, offcCtx))
        if(p.grid){
            const g = p.grid
            ctx.lineWidth = g.width
            ctx.strokeStyle = color ?? g.color ?? 'white'
            ctx.globalAlpha = opacity ?? g.opacity ?? 1
            let _lu:Coord = [0, 0]
            let _ru:Coord = [p.width, 0]
            let _lb:Coord = [0, p.height]
            let _rb:Coord = [p.width, p.height]
            let _l:Coord = [0, p.height/2]
            let _u:Coord = [p.width/2, 0]
            let _r:Coord = [p.width, p.height/2]
            let _b:Coord = [p.width/2, p.height];
            ([_lu, _ru, _lb, _rb, _l, _u, _r, _b]).forEach(c=>{
                c[0] -= offset[0]
                c[1] -= offset[1]
            })
            for(let x = 0; x <= enlarge; x++){
                for(let y = 0; y <= enlarge; y++){
                    let [lu, ru, lb, rb, l, u, r, b] = [_lu, _ru, _lb, _rb, _l, _u, _r, _b].map(c=>{
                        return [
                            c[0] + p.width*x,
                            c[1] + p.height*y
                        ] as const
                    })
                    if(g.horizontal){
                        ctx.moveTo(...l)
                        ctx.lineTo(...r)
                    }
                    if(g.vertical){
                        ctx.moveTo(...u)
                        ctx.lineTo(...b)
                    }
                    if(g.rise27){
                        ctx.moveTo(...l) //从左...
                        ctx.lineTo(...ru) //画到右上
                        ctx.moveTo(...lb) //从左下...
                        ctx.lineTo(...r) //画到右中...
                    }
                    if(g.rise45){
                        ctx.moveTo(...lb) //从左下...
                        ctx.lineTo(...ru) //画到右上
                    }
                    if(g.rise63){
                        ctx.moveTo(...lb)
                        ctx.lineTo(...u)
                        ctx.moveTo(...b)
                        ctx.lineTo(...ru)
                    }
                    if(g.fall27){
                        ctx.moveTo(...lu) 
                        ctx.lineTo(...r) 
                        ctx.moveTo(...l) 
                        ctx.lineTo(...rb)
                    }
                    if(g.fall45){
                        ctx.moveTo(...lu) 
                        ctx.lineTo(...rb)
                    }
                    if(g.fall63){
                        ctx.moveTo(...lu)
                        ctx.lineTo(...b)
                        ctx.moveTo(...u)
                        ctx.lineTo(...rb)
                    }
                }
            }
            ctx.stroke()
        }
        return ctx.getUnderlyingCanvas()
    }

    return {
        getRendered
    }
})