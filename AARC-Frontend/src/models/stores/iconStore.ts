import { defineStore, storeToRefs } from "pinia";
import { useSaveStore } from "./saveStore";
import { ref } from "vue";

export interface TextTagIconData{
    img?:HTMLImageElement
    naturalWidth?:number
    naturalHeight?:number
    status?:'loading'|'loaded'|'failed',
    errmsg?:string
}

const maxLoadWaitMs = 8000
const maxIconSizeKb = 200
const maxIconSize = maxIconSizeKb*1000
export const useIconStore = defineStore('iconStore', ()=>{
    const { save } = storeToRefs(useSaveStore())
    const data = ref(new Map<number, TextTagIconData>())
    async function ensureAllLoaded(){
        const proms:Promise<void>[] = []
        const icons = save.value?.textTagIcons ?? []
        for(const ic of icons){
            let imgData = data.value.get(ic.id)
            if(!imgData){
                imgData = {status:'loading'}
                data.value.set(ic.id, imgData)
            }
            if(!imgData?.img || !ic.url || imgData?.img.src !== ic.url){
                proms.push(new Promise((res)=>{
                    if(!ic.url){
                        imgData.status = 'failed'
                        imgData.errmsg = '缺少链接'
                        res()
                        return
                    }
                    checkUrlValid(ic.url)
                        .then(checkErr=>{
                            if(checkErr){
                                imgData.status = 'failed'
                                imgData.errmsg = checkErr
                                res()
                            }else{
                                const img = new Image()
                                imgData.img = img
                                img.src = ic.url ?? ''
                                let timer = window.setTimeout(()=>{
                                    imgData.status = 'failed'
                                    imgData.errmsg = '加载超时'
                                    res()
                                }, maxLoadWaitMs)
                                img?.addEventListener('load', ()=>{
                                    window.clearTimeout(timer)
                                    imgData.status = 'loaded'
                                    imgData.errmsg = undefined
                                    imgData.naturalWidth = img.naturalWidth
                                    imgData.naturalHeight = img.naturalHeight
                                    console.log(`[icon]"${ic.name}"(${ic.url})数据加载成功`)
                                    res()
                                })
                                img?.addEventListener('error', ()=>{
                                    window.clearTimeout(timer)
                                    imgData.status = 'failed'
                                    imgData.errmsg = '加载失败'
                                    console.warn(`[icon]"${ic.name}"(${ic.url})数据加载失败`)
                                    res()
                                })
                            }
                        })
                }))
            }
        }
        await Promise.all(proms)
        for(const item of data.value.values()){
            if(item.errmsg){
                item.img = undefined
            }
        }
    }
    function getDataByIconId(id:number){
        return data.value.get(id)
    }
    function clearItems(){
        data.value.clear()
    }
    async function checkUrlValid(url:string):Promise<string|undefined>{
        try{
            const res = await fetch(url, {method:'HEAD'})
            if(!res.ok)
                return "加载失败"
            const type = res.headers.get("Content-Type")
            if(!type)
                return "链接异常"
            if(!type.startsWith("image"))
                return "链接非图片"
            const length = parseInt(res.headers.get("Content-Length")??'')
            if(isNaN(length))
                return "链接异常"
            if(length>maxIconSize)
                return `不可大于${maxIconSizeKb}KB`
        }
        catch(error){
            return "加载失败"
        }
    }
    return {
        ensureAllLoaded,
        getDataByIconId,
        clearItems
    }
})