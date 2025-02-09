import { defineStore } from "pinia";
import { useLineSimplifiedCvsWorker } from "../workers/lineSimplifiedCvsWorker";
import { CvsBlock, CvsContext } from "../common/cvsContext";
import { useSaveStore } from "@/models/stores/saveStore";

export const useMiniatureCvsDispatcher = defineStore('miniatureCvsDispatcher', ()=>{
    const lineSimplifiedCvsWorker = useLineSimplifiedCvsWorker()
    const saveStore = useSaveStore()
    function renderMiniatureCvs(sideLength:number, lineWidth:number){
        const cvs = new OffscreenCanvas(sideLength, sideLength)
        const ctx2d = cvs.getContext('2d')
        if(ctx2d === null)
            throw new Error('ctx2d is null')
        const w = saveStore.cvsWidth
        const h = saveStore.cvsHeight
        let ratio:number;
        let top = 0;
        let left = 0;
        if(w >= h){
            ratio = sideLength / w
            const diff = (w-h)/2
            top = -diff * ratio
        }
        else{
            ratio = sideLength / h
            const diff = (h-w)/2
            left = -diff * ratio
        }
        const ctx = new CvsContext([
            new CvsBlock(ratio, left, top, ctx2d)
        ])
        ctx.fillStyle = 'white'
        ctx.fillTotal()
        lineSimplifiedCvsWorker.renderAllLines(ctx, lineWidth)
        return cvs
    }
    return {
        renderMiniatureCvs       
    }
})