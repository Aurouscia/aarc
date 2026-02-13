import { defineStore, storeToRefs } from "pinia";
import { useSaveStore } from "./saveStore";
import { CvsBlock, CvsContext } from "../cvs/common/cvsContext";
import { Coord } from "../coord";
import { coordAdd } from "@/utils/coordUtils/coordMath";

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
        const offc = new OffscreenCanvas(cvsWidth, cvsHeight)
        const offcCtx = offc.getContext('2d')!
        const ctx = new CvsContext(new CvsBlock(scale, 0, 0, offcCtx))
        if(p.grid){
            const g = p.grid
            ctx.lineWidth = g.width
            ctx.strokeStyle = color ?? g.color ?? 'white'
            ctx.globalAlpha = opacity ?? g.opacity ?? 1
            let lu:Coord = [0, 0]
            let ru:Coord = [p.width, 0]
            let lb:Coord = [0, p.height]
            let rb:Coord = [p.width, p.height]
            let l:Coord = [0, p.height/2]
            let u:Coord = [p.width/2, 0]
            let r:Coord = [p.width, p.height/2]
            let b:Coord = [p.width/2, p.height];
            ([lu, ru, lb, rb, l, u, r, b]).forEach(c=>{
                c[0] -= offset[0]
                c[1] -= offset[1]
            })
            if(g.fall45){
                for (let i = -enlarge; i <= enlarge; i++) {
                    const from = coordAdd(lu, [p.width * i, 0])
                    const to = coordAdd(rb, [p.width * (i + enlarge), p.height * enlarge])
                    ctx.moveTo(...from)
                    ctx.lineTo(...to)
                }
            }
            if(g.rise45){
                for (let i = 0; i <= enlarge * 2; i++) {
                    const from = coordAdd(lb, [p.width * (i - enlarge), p.height * enlarge])
                    const to = coordAdd(ru, [p.width * i, 0])
                    ctx.moveTo(...from)
                    ctx.lineTo(...to)
                }
            }
            for(let i = 0; i <= enlarge; i++){
                if(g.horizontal){
                    const from = coordAdd(lu, [0, p.height * i])
                    const to = coordAdd(ru, [p.width * enlarge, p.height * i])
                    ctx.moveTo(...from)
                    ctx.lineTo(...to)
                }
                if(g.vertical){
                    const from = coordAdd(lu, [p.width * i, 0])
                    const to = coordAdd(lb, [p.width * i, p.height * enlarge])
                    ctx.moveTo(...from)
                    ctx.lineTo(...to)
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