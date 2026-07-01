import { defineStore } from "pinia";
import { useLineSimplifiedCvsWorker } from "../workers/lineSimplifiedCvsWorker";
import { CvsBlock, CvsContext } from "../common/cvsContext";
import { useSaveStore } from "@/models/stores/saveStore";
import { Line } from "@/models/save";
import { Context as SvgCanvasContext } from 'svgcanvas';
import { optimizeSvg } from "@/utils/svgUtils/optimizeSvg";

export const useMiniatureCvsDispatcher = defineStore('miniatureCvsDispatcher', ()=>{
    const lineSimplifiedCvsWorker = useLineSimplifiedCvsWorker()
    const saveStore = useSaveStore()

    function calcMiniatureLayout(sideLength: number) {
        const w = saveStore.cvsWidth
        const h = saveStore.cvsHeight
        let ratio: number
        let top = 0
        let left = 0
        if(w >= h){
            ratio = sideLength / w
            const diff = (w-h)/2
            top = -diff * ratio
        }else{
            ratio = sideLength / h
            const diff = (h-w)/2
            left = -diff * ratio
        }
        return { ratio, top, left }
    }

    function renderMiniatureCvs(options:{sideLength:number, lineWidth:number, lines?:Line[], filterNotOpened?:boolean}){
        const { sideLength, lineWidth, lines, filterNotOpened} = options
        const cvs = new OffscreenCanvas(sideLength, sideLength)
        const ctx2d = cvs.getContext('2d')
        if(ctx2d === null)
            throw new Error('ctx2d is null')
        const { ratio, top, left } = calcMiniatureLayout(sideLength)
        const ctx = new CvsContext(
            new CvsBlock(ratio, left, top, ctx2d)
        )
        ctx.fillStyle = 'white'
        ctx.fillTotal()
        lineSimplifiedCvsWorker.renderAllLines(ctx, {lineWidth: lineWidth/ratio, lines, filterNotOpened})
        return cvs
    }

    async function renderMiniatureCvsToSvgBlob(options:{sideLength:number, lineWidth:number, lines?:Line[], filterNotOpened?:boolean}):Promise<Blob>{
        const { sideLength, lineWidth, lines, filterNotOpened} = options
        const svgCtx = new SvgCanvasContext({ width: sideLength, height: sideLength })
        const { ratio, top, left } = calcMiniatureLayout(sideLength)
        const ctx = new CvsContext(
            new CvsBlock(ratio, left, top, svgCtx)
        )
        ctx.fillStyle = 'white'
        ctx.fillTotal()
        lineSimplifiedCvsWorker.renderAllLines(ctx, {lineWidth: lineWidth/ratio, lines, filterNotOpened})
        const svgStr = svgCtx.getSerializedSvg(true)
        let optimizedSvgStr = svgStr
        try {
            optimizedSvgStr = await optimizeSvg(svgStr)
        } catch (e) {
            console.error('SVGO 优化失败，使用原始 SVG', e)
        }
        return new Blob([optimizedSvgStr], { type: 'image/svg+xml;charset=utf-8' })
    }

    async function renderMiniatureCvsToSvgBlobUrl(options:{sideLength:number, lineWidth:number, lines?:Line[], filterNotOpened?:boolean}):Promise<string>{
        const blob = await renderMiniatureCvsToSvgBlob(options)
        return URL.createObjectURL(blob)
    }

    return {
        renderMiniatureCvs,
        renderMiniatureCvsToSvgBlob,
        renderMiniatureCvsToSvgBlobUrl
    }
})
