import { defineStore } from "pinia";
import { CvsContext } from "../common/cvsContext";
import { useSaveStore } from "@/models/stores/saveStore";
import { AdsRenderType } from "@/app/localConfig/exportLocalConfig";

export const useAdsCvsWorker = defineStore('adsCvsWorker',()=>{
    const saveStore = useSaveStore()
    const textLess = import.meta.env.VITE_AdsTextLess as string|undefined
    const textMore = import.meta.env.VITE_AdsTextMore as string|undefined
    function renderAds(ctx:CvsContext, type?:AdsRenderType){
        if(!type || type == 'no')
            return
        const h = saveStore.cvsHeight
        ctx.textAlign = 'left'
        ctx.textBaseline = 'bottom'
        ctx.globalAlpha = 0.5
        ctx.fillStyle = 'black'
        const fontSize = Math.max(saveStore.cvsWidth/70, 28)
        ctx.font = {fontSize: fontSize, font:'sans-serif'}
        const margin = fontSize/3
        if(type == 'less'){
            if(textLess)            
                ctx.fillText(textLess, margin, h-margin)
        }else if(type == 'more'){
            if(textMore)
                ctx.fillText(textMore, margin, h-margin)
        }
        ctx.globalAlpha = 1
    }
    return {
        renderAds
    }
})