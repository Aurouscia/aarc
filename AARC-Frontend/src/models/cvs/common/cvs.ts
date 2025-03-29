import { computed, nextTick, ref } from "vue";
import { CvsBlock, CvsContext } from "./cvsContext";
import { useCvsFrameStore } from "@/models/stores/cvsFrameStore";
import { defineStore, storeToRefs } from "pinia";
import { useSaveStore } from "@/models/stores/saveStore";
//import { useEditorLocalConfigStore } from "@/app/localConfig/editorLocalConfig";

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
    //const editorLocalConfig = useEditorLocalConfigStore()
    const blocksControl = ref<BlockControl[]>([])
    //原思路：将整个canvas分成若干块，每块的大小和位置都是固定的，这样就可以避免放大（高清）时canvas过大造成爆内存
    //后来发现canvas块状况在切换时会不响应用户的操作，非常影响使用体验，所以放弃了这个方案
    //现在的思路：只要一个canvas块，大小和位置随用户操作而变化，但尺寸保持恒定

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

    function clientToCvsSizeRatio(){
        // const r = editorLocalConfig.readResolution()
        // if(r==='ultra')
        //     return 3
        // if(r==='high')
        //     return 2.5
        return 2
    }

    const bleed = 0.2
    function refreshBlocks(callReformedHandler = true){
        const cont = fStore.cvsCont
        const frame = fStore.cvsFrame
        if(!frame || !cont)
            return
        const viewRectOriginal = {...fStore.getViewRectInRatio()}
        const widthRatioOri = viewRectOriginal.right - viewRectOriginal.left
        const heightRatioOri = viewRectOriginal.bottom - viewRectOriginal.top
        const viewRect = {...viewRectOriginal}
        viewRect.left -= widthRatioOri*bleed
        viewRect.right += widthRatioOri*bleed
        viewRect.top -= heightRatioOri*bleed
        viewRect.bottom += heightRatioOri*bleed
        if(viewRect.left<0)
            viewRect.left = 0
        if(viewRect.right>1)
            viewRect.right = 1
        if(viewRect.top<0)
            viewRect.top = 0
        if(viewRect.bottom>1)
            viewRect.bottom = 1
        const widthRatio =  (viewRect.right - viewRect.left)
        const heightRatio = (viewRect.bottom - viewRect.top)
        const xEnlargedBy = widthRatio/widthRatioOri
        const yEnlargedBy = heightRatio/heightRatioOri
        const res:BlockControl[] = []
        const sizeRatio = clientToCvsSizeRatio()
        const canvasHeight = Math.round((frame.clientHeight||10) * sizeRatio * yEnlargedBy)
        const canvasWidth = Math.round((frame.clientWidth||10) * sizeRatio * xEnlargedBy)
        const leftRatio = viewRect.left
        const topRatio = viewRect.top
        res.push({
            idx: 0,
            widthRatio, heightRatio,
            leftRatio, topRatio,
            canvasWidth,
            canvasHeight,
            key: Math.random()
        })
        blocksControl.value = res
        if(callReformedHandler){
            nextTick(()=>{
                blocksReformHandler.value.forEach(f=>f())
            })
        }
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