import { ref } from "vue";

export function useCvs(){
    const cvs = ref<HTMLCanvasElement>()
    let ctx:CanvasRenderingContext2D|undefined = undefined;
    let ctxTakenFrom:HTMLCanvasElement|undefined = undefined;
    function getCtx(){
        if(ctx && ctxTakenFrom === cvs.value)
            return ctx;
        const res = cvs.value?.getContext('2d')
        if(!res)
            throw Error('获取画布上下文失败')
        ctxTakenFrom = cvs.value
        ctx = res;
        return res;
    }
    function getCtxWithClearing(clear = true){
        const ctx = getCtx();
        if(clear){
            const cvs = ctx.canvas;
            ctx.clearRect(0, 0, cvs.width, cvs.height);
        }
        return ctx
    }
    return { cvs, getCtx: getCtxWithClearing }
}