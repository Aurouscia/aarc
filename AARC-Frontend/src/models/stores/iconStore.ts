import { defineStore, storeToRefs } from "pinia";
import { useSaveStore } from "./saveStore";

export interface TextTagIconData{
    img?:HTMLImageElement
    naturalWidth?:number
    naturalHeight?:number
    status?:'loading'|'loaded'|'failed'
}
export const useIconStore = defineStore('iconStore', ()=>{
    const { save } = storeToRefs(useSaveStore())
    const data = new Map<number, TextTagIconData>()
    async function ensureAllLoaded(){
        const proms:Promise<void>[] = []
        const icons = save.value?.textTagIcons ?? []
        for(const ic of icons){
            if(!ic.url)
                continue
            let imgData = data.get(ic.id)
            if(!imgData){
                imgData = {status:'loading'}
                data.set(ic.id, imgData)
            }
            if(!imgData?.img || imgData?.img.src !== ic.url){
                const img = new Image()
                imgData.img = img
                img.src = ic.url
                proms.push(new Promise((res)=>{
                    //TODO：超时机制
                    img?.addEventListener('load', ()=>{
                        res()
                        imgData.status = 'loaded'
                        imgData.naturalWidth = img.naturalWidth
                        imgData.naturalHeight = img.naturalHeight
                        console.log(`[icon]"${ic.name}"(${ic.url})数据加载成功`)
                    })
                    img?.addEventListener('error', ()=>{
                        res()
                        imgData.status = 'failed'
                        console.warn(`[icon]"${ic.name}"(${ic.url})数据加载失败`)
                    })
                }))
            }
        }
        await Promise.all(proms)
    }
    function getDataByIconId(id:number){
        return data.get(id)
    }
    function clearItems(){
        data.clear()
    }
    return {
        ensureAllLoaded,
        getDataByIconId,
        clearItems
    }
})