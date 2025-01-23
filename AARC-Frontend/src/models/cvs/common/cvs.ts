import { computed, nextTick, ref } from "vue";
import { CvsBlock, CvsContext } from "./cvsContext";
import { useCvsFrameStore } from "@/models/stores/cvsFrameStore";
import { defineStore, storeToRefs } from "pinia";
import { useSaveStore } from "@/models/stores/saveStore";

export function useCvs(canvasIdPrefix:string){
    const blocks = ref<CvsBlock[]>([])
    const bStore = useCvsBlocksControlStore()
    const { cvsWidth, cvsHeight } = storeToRefs(useSaveStore())

    const ctx = computed<CvsContext>(()=>{
        bStore.blockRefreshingInit()
        blocks.value = []
        for(const b of bStore.blocksControl){
            const canvasId = `${canvasIdPrefix}${b.idx}`
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement
            const ctx2d = canvas.getContext('2d')!
            const pxColCount = b.widthRatio * cvsWidth.value
            const mapScale = b.canvasWidth / pxColCount
            const xOffset = mapScale*(cvsWidth.value * b.leftRatio)
            const yOffset = mapScale*(cvsHeight.value * b.topRatio)
            blocks.value.push(new CvsBlock(mapScale, xOffset, yOffset, ctx2d))
        }
        return new CvsContext(blocks);
    })
    function getCtx(){
        return ctx.value
    }
    function getCtxWithClearing(clear = true){
        const ctx = getCtx();
        if(clear){
            ctx.clear();
        }
        return ctx
    }
    return { getCtx: getCtxWithClearing }
}

export const useCvsBlocksControlStore = defineStore('cvsBlocksControl', ()=>{
    const fStore = useCvsFrameStore()
    const saveStore = useSaveStore()
    const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
    const blocksControl = ref<{
        idx:number
        widthRatio:number
        heightRatio:number
        leftRatio:number
        topRatio:number
        canvasWidth:number
        canvasHeight:number
        key:number
    }[]>([])
    const blockSideLength = ref<number>(1000)

    let blockRefreshingInited = false
    function blockRefreshingInit(){
        if(blockRefreshingInited)
            return
        blockRefreshingInited = true
        fStore.viewMoveHandlers.push(viewMutateHandler)
        fStore.viewScaleHandlers.push(viewMutateHandler)
    }
    //let viewMutateLastReact = 0
    let viewMutateEndedTimer = 0
    function viewMutateHandler(){
        window.clearTimeout(viewMutateEndedTimer)
        viewMutateEndedTimer = window.setTimeout(()=>{
            //viewMutateLastReact = Date.now()
            refreshBlocks()
        }, 300)
        // const now = Date.now()
        // if(now - viewMutateLastReact < 800)
        //     return
        // viewMutateLastReact = now
        // refreshBlocks()
    }
    const wRatioEach = computed(()=>blockSideLength.value/cvsWidth.value)
    const hRatioEach = computed(()=>blockSideLength.value/cvsHeight.value)
    const rectMargin = 0.001
    function refreshBlocks(){
        console.log('刷新画布块')
        const displayRatio = fStore.getDisplayRatio('smaller')
        const cont = fStore.cvsCont
        const frame = fStore.cvsFrame
        if(!frame || !cont)
            return
        if(displayRatio < 1.6){
            const rect = fStore.getViewRectInRatio()
            const containedXs:number[] = []
            const containedYs:number[] = []
            let tryingX = 0
            while(true){
                const ratioNext = (tryingX+1) * wRatioEach.value
                if(ratioNext > rect.left - rectMargin)
                    containedXs.push(tryingX)
                if(ratioNext > rect.right - rectMargin || tryingX>1e5)
                    break;
                tryingX++
            }
            let tryingY = 0
            while(true){
                const ratioNext = (tryingY+1) * hRatioEach.value
                if(ratioNext > rect.top - rectMargin)
                    containedYs.push(tryingY)
                if(ratioNext > rect.bottom - rectMargin || tryingY>1e5)
                    break;
                tryingY++
            }
            blocksControl.value = []
            let blockIdx = 0
            for(let xidx=0;xidx<containedXs.length;xidx++){
                const x = containedXs[xidx]
                for(let yidx=0;yidx<containedYs.length;yidx++){
                    const y = containedYs[yidx]
                    blocksControl.value.push({
                        idx: blockIdx++,
                        widthRatio: wRatioEach.value,
                        heightRatio: hRatioEach.value,
                        leftRatio: x*wRatioEach.value,
                        topRatio: y*hRatioEach.value,
                        canvasWidth: blockSideLength.value,
                        canvasHeight: blockSideLength.value,
                        key:Math.random()
                    })
                }
            }
        }else{
            const whr = cvsWidth.value/cvsHeight.value
            const canvasHeight = frame.clientHeight
            const canvasWidth = canvasHeight * whr
            blocksControl.value = [{
                idx: 0,
                widthRatio:1, heightRatio:1,
                leftRatio:0, topRatio:0,
                canvasWidth,
                canvasHeight,
                key:0
            }]
        }
        nextTick(()=>{
            blocksReformHandler.value.forEach(f=>f())
        })
    }

    const blocksReformHandler = ref<(()=>void)[]>([])

    return {
        blockRefreshingInit,
        blocksControl,
        blockSideLength,
        blocksReformHandler
    }
})