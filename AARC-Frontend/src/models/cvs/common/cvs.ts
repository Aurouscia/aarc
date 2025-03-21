import { computed, nextTick, ref } from "vue";
import { CvsBlock, CvsContext } from "./cvsContext";
import { useCvsFrameStore } from "@/models/stores/cvsFrameStore";
import { defineStore, storeToRefs } from "pinia";
import { useSaveStore } from "@/models/stores/saveStore";
import { useEditorLocalConfigStore } from "@/app/localConfig/editorLocalConfig";

export function useCvs(canvasIdPrefix:string){
    const bStore = useCvsBlocksControlStore()
    const { cvsWidth, cvsHeight } = storeToRefs(useSaveStore())

    const ctx = computed<CvsContext>(()=>{
        const blocks = []
        for(const b of bStore.blocksControl){
            const canvasId = `${canvasIdPrefix}${b.idx}`
            const canvas = document.getElementById(canvasId) as HTMLCanvasElement
            const ctx2d = canvas.getContext('2d')!
            const pxColCount = b.widthRatio * cvsWidth.value
            const mapScale = b.canvasWidth / pxColCount
            const xOffset = mapScale*(cvsWidth.value * b.leftRatio)
            const yOffset = mapScale*(cvsHeight.value * b.topRatio)
            blocks.push(new CvsBlock(mapScale, xOffset, yOffset, ctx2d))
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

export interface BlockControl{
    idx:number
    widthRatio:number
    heightRatio:number
    leftRatio:number
    topRatio:number
    canvasWidth:number
    canvasHeight:number
    key:number
}
export const useCvsBlocksControlStore = defineStore('cvsBlocksControl', ()=>{
    const fStore = useCvsFrameStore()
    const saveStore = useSaveStore()
    const editorLocalConfig = useEditorLocalConfigStore()
    const { cvsWidth, cvsHeight } = storeToRefs(saveStore)
    const blocksControl = ref<BlockControl[]>([])

    let blocksControlInited = false
    function blocksControlInit(){
        if(blocksControlInited)
            return
        blocksControlInited = true
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
        }, 100)
        // const now = Date.now()
        // if(now - viewMutateLastReact < 800)
        //     return
        // viewMutateLastReact = now
        // refreshBlocks()
    }

    const maxCvsSideLengthWhenMayAppear4Blocks = computed<number>(()=>{
        const rtype = editorLocalConfig.resolution
        if(rtype == 'ultra')
            return 3000
        if(rtype == 'high')
            return 2250
        return 1500
    })
        
    function getBlockSideLength(sidePx:number){
        if(sidePx < 750)
            return 750
        if(sidePx < 1500)
            return 1500
        if(sidePx < 3000)
            return 3000
        if(sidePx < 4500)
            return 4500
        return 6000
    }
    function getWRRatioEach(blockSideLength:number){
        return {
            widthRatio: blockSideLength/cvsWidth.value,
            heightRatio: blockSideLength/cvsHeight.value,
        }
    }
    const rectMargin = 0.001
    function refreshBlocks(callReformedHandler:'auto'|'suppress'|'enforce' = 'auto'){
        const sidePx = fStore.getBiggerSideLength()
        const blockSideLength = getBlockSideLength(sidePx)
        const cont = fStore.cvsCont
        const frame = fStore.cvsFrame
        if(!frame || !cont)
            return
        const res:BlockControl[] = []
        if(blockSideLength <= 4500 && blockSideLength < cvsWidth.value && blockSideLength < cvsHeight.value){
            const rect = fStore.getViewRectInRatio()
            const containedXs:number[] = []
            const containedYs:number[] = []
            let tryingX = 0
            const { widthRatio, heightRatio } = getWRRatioEach(blockSideLength)
            while(true){
                const ratioNext = (tryingX+1) * widthRatio
                if(ratioNext > rect.left - rectMargin)
                    containedXs.push(tryingX)
                if(ratioNext > rect.right - rectMargin || tryingX>1e5)
                    break;
                tryingX++
            }
            let tryingY = 0
            while(true){
                const ratioNext = (tryingY+1) * heightRatio
                if(ratioNext > rect.top - rectMargin)
                    containedYs.push(tryingY)
                if(ratioNext > rect.bottom - rectMargin || tryingY>1e5)
                    break;
                tryingY++
            }
            let blockIdx = 0
            for(let xidx=0;xidx<containedXs.length;xidx++){
                const x = containedXs[xidx]
                for(let yidx=0;yidx<containedYs.length;yidx++){
                    const y = containedYs[yidx]
                    res.push({
                        idx: blockIdx++,
                        widthRatio,
                        heightRatio,
                        leftRatio: x*widthRatio,
                        topRatio: y*heightRatio,
                        canvasWidth: maxCvsSideLengthWhenMayAppear4Blocks.value,
                        canvasHeight: maxCvsSideLengthWhenMayAppear4Blocks.value,
                        key:Math.random()
                    })
                }
            }
        }else{
            const maxSideLengthWhenSingleBlock = maxCvsSideLengthWhenMayAppear4Blocks.value * 2
            const side = maxSideLengthWhenSingleBlock
            const whr = cvsWidth.value/cvsHeight.value
            const canvasHeight = Math.min(side, side/whr, cvsHeight.value)
            const canvasWidth = canvasHeight * whr
            res.push({
                idx: 0,
                widthRatio:1, heightRatio:1,
                leftRatio:0, topRatio:0,
                canvasWidth,
                canvasHeight,
                key:0
            })
        }
        const sideLengthInfo = blockSideLength ? `，(${blockSideLength}px)`:'(整体)'
        console.log(`画布块${res.length}个${sideLengthInfo}`)
        if(callReformedHandler!=='suppress'){
            const brief = blocksControlBrief(res)
            if(brief !== lastHandledBrief || callReformedHandler==='enforce'){
                blocksControl.value = res
                nextTick(()=>{
                    blocksReformHandler.value.forEach(f=>f())
                })
            }
            lastHandledBrief = brief
        }else{
            blocksControl.value = res
            lastHandledBrief = blocksControlBrief(res)
        }
    }
    let lastHandledBrief = ''
    function blocksControlBrief(bc:BlockControl[]){
        const briefs = bc.map(x=>`${x.widthRatio}${x.heightRatio}${x.leftRatio}${x.topRatio}`)
        return briefs.join()
    }
    const blocksReformHandler = ref<(()=>void)[]>([])

    const blockTotalBoundary = computed(()=>{
        let left = 1e10
        let right = 0
        let top = 1e10
        let bottom = 0
        for(const bc of blocksControl.value){
            const l = bc.leftRatio
            const r = l + bc.widthRatio
            const t = bc.topRatio
            const b = t + bc.heightRatio
            if(l<left)
                left = l
            if(r>right)
                right = r
            if(t<top)
                top = t
            if(b>bottom)
                bottom = b
        }
        return {left, right, top, bottom}
    })
    function clearItems(){
        blocksControl.value = []
    }

    return {
        blocksControl,
        blocksReformHandler,
        blocksControlInit,
        refreshBlocks,
        blockTotalBoundary,
        clearItems
    }
})