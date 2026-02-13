import { defineStore, storeToRefs } from "pinia";
import { useSaveStore } from "./saveStore";
import { CvsBlock, CvsContext } from "../cvs/common/cvsContext";

export const usePatternStore = defineStore('pattern', ()=>{
    // 不要去读saveStore（非常大且与本功能无关），读src/models/save.ts中的interface Pattern即可
    const { save } = storeToRefs(useSaveStore())

    function getRendered(id:number, scale:number, color?:string, opacity?:number){
        const p = save.value?.patterns?.find(x=>x.id == id)
        if(!p) 
            return
        const offc = new OffscreenCanvas(p.width * scale, p.height * scale)
        const offcCtx = offc.getContext('2d')
        if(!offcCtx) throw new Error('获取OffscreenCanvas上下文失败')
        const ctx = new CvsContext(new CvsBlock(scale, 0, 0, offcCtx))
        if(p.grid){
            const g = p.grid
            ctx.lineWidth = g.width
            ctx.strokeStyle = color ?? g.color ?? 'white'
            ctx.globalAlpha = opacity ?? g.opacity ?? 1
            const lu = [0, 0] as const
            const ru = [p.width, 0] as const
            const lb = [0, p.height] as const
            const rb = [p.width, p.height] as const
            const l = [0, p.height/2] as const
            const u = [p.width/2, 0] as const
            const r = [p.width, p.height/2] as const
            const b = [p.width/2, p.height] as const
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
            ctx.stroke()
        }
        return ctx.getUnderlyingCanvas()
    }

    return {
        getRendered
    }
})