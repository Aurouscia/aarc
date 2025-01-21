import { ref } from "vue";
import { CvsBlock, CvsContext } from "./cvsContext";

export function useCvs(){
    const cvs = ref<HTMLCanvasElement>()
    let ctx:CvsContext|undefined = undefined;
    let ctxTakenFrom:HTMLCanvasElement|undefined = undefined;
    const blocks = ref<CvsBlock[]>([])
    function getCtx():CvsContext{
        if(ctx && ctxTakenFrom === cvs.value)
            return ctx;
        const ctx2d = cvs.value?.getContext('2d')
        if(!ctx2d)
            throw Error('获取画布上下文失败')
        ctxTakenFrom = cvs.value
        blocks.value = [new CvsBlock(1, 0, 0, ctx2d)]
        ctx = new CvsContext(blocks)
        return ctx;
    }
    function getCtxWithClearing(clear = true){
        const ctx = getCtx();
        if(clear){
            ctx.clear();
        }
        return ctx
    }
    return { cvs, getCtx: getCtxWithClearing }
}