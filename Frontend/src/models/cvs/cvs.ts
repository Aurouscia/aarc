import { ref, shallowRef } from "vue";

export function useCvs(){
    const cvs = ref<HTMLCanvasElement>()
    const ctx = shallowRef<CanvasRenderingContext2D>()
    function getCtx(){
        if(ctx.value)
            return ctx.value;
        const res = cvs.value?.getContext('2d')
        if(!res)
            throw Error('获取画布上下文失败')
        ctx.value = res;
        return res;
    }
    return { cvs, getCtx }
}