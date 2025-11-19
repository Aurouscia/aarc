import { defineStore, storeToRefs } from "pinia";
import { useSaveStore } from "./saveStore";
import { computed, ref } from "vue";
import { TextTagIcon } from "../save";

export interface TextTagIconData{
    img?:HTMLImageElement
    naturalWidth?:number
    naturalHeight?:number
    status?:'loading'|'loaded'|'failed',
    errmsg?:string
}
export interface TextTagIconDisplayItem{
    i:TextTagIcon,
    data?:TextTagIconData
} 

const maxLoadWaitMs = 8000
const maxIconSizeMb = 1
const maxIconSize = maxIconSizeMb*1024*1024
export const useIconStore = defineStore('iconStore', ()=>{
    const { save } = storeToRefs(useSaveStore())
    const data = ref(new Map<number, TextTagIconData>())
    async function ensureAllLoaded():Promise<number[]>{
        const proms:Promise<void>[] = []
        const icons = save.value?.textTagIcons ?? []
        let triedIds:number[] = []
        for(const ic of icons){
            let imgData = data.value.get(ic.id)
            if(!imgData){
                imgData = {status:'loading'}
                data.value.set(ic.id, imgData)
            }
            let icUrlFull = ic.url ?? ""
            if(icUrlFull?.startsWith('/'))
                icUrlFull = window.location.origin + icUrlFull
            else
                icUrlFull = convertToProxyUrlIfNeeded(icUrlFull)
            if(!imgData?.img || !ic.url || imgData?.img.src !== icUrlFull){
                triedIds.push(ic.id)
                proms.push(new Promise((res)=>{
                    if(!ic.url){
                        imgData.status = 'failed'
                        imgData.errmsg = '缺少链接'
                        console.warn(`[icon]"${ic.name}"(${ic.url})缺少链接`)
                        res()
                        return
                    }
                    checkUrlValid(ic.url)
                        .then(checkErr=>{
                            if(checkErr){
                                imgData.status = 'failed'
                                imgData.errmsg = checkErr
                                console.warn(`[icon]"${ic.name}"(${ic.url})${checkErr}`)
                                res()
                            }else{
                                const img = new Image()
                                imgData.img = img
                                img.src = convertToProxyUrlIfNeeded(ic.url ?? '')
                                let timer = window.setTimeout(()=>{
                                    imgData.status = 'failed'
                                    imgData.errmsg = '加载超时'
                                    console.warn(`[icon]"${ic.name}"(${ic.url})数据加载超时`)
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
        return triedIds
    }
    function getDataByIconId(id:number){
        return data.value.get(id)
    }
    function clearItems(){
        data.value.clear()
    }
    async function checkUrlValid(url:string):Promise<string|undefined>{
        try{
            url = convertToProxyUrlIfNeeded(url)
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
                return `不可大于${maxIconSizeMb}MB`
        }
        catch(error){
            return "加载失败"
        }
    }
    function convertToProxyUrlIfNeeded(url:string){
        if(url.startsWith('/'))
            return url
        const origin = window.location.origin
        if(url.startsWith(origin)){
            return url
        }
        const encoded = encodeURIComponent(url)
        const baseUrl = import.meta.env.VITE_ApiUrlBase
        return `${baseUrl}/proxy/icon/${encoded}`
    }

    const sep = '-'
    const noPrefix = '其他'
    const prefixes = computed<string[]>(()=>{
        const res = new Set<string>()
        let hasUngrouped = false
        save.value?.textTagIcons?.forEach(i=>{
            const prefix = getPrefixFromIconName(i.name)
            if(prefix){
                res.add(prefix)
            }else{
                hasUngrouped = true
            }
        })
        const resArr = [...res]
        resArr.sort()
        if(hasUngrouped || res.size === 0)
            resArr.push(noPrefix)
        return resArr
    })
    const prefixSelected = ref<string>()
    const prefixedIcons = computed<TextTagIconDisplayItem[]>(()=>{
        const icons = save.value?.textTagIcons?.filter(x=>{
            const prefix = getPrefixFromIconName(x.name)
            if(prefix === null){
                return prefixSelected.value === noPrefix
            }
            return prefix == prefixSelected.value
        }) ?? []
        const res:TextTagIconDisplayItem[] = []
        icons.forEach(i=>{
            const data = getDataByIconId(i.id)
            res.push({
                i,
                data
            })
        })
        res.sort((a,b)=> (a.i.name??"").localeCompare(b.i.name??""))
        return res
    })

    function getPrefixFromIconName(iName?:string):string|null{
        if(iName?.includes(sep)){
            return iName.split(sep).at(0) || null
        }
        return null
    }
    function ensurePrefixSelectedValid(){
        if(!prefixSelected.value || !prefixes.value.includes(prefixSelected.value)){
            prefixSelected.value = prefixes.value.at(0)
        }
    }
    function enforcePrefixSelectedTo(iconId:number){
        if(!prefixSelected.value)
            prefixSelected.value = prefixes.value.at(0)
        const icon = save.value?.textTagIcons?.find(x=>x.id===iconId)
        if(!icon)
            return
        const prefix = getPrefixFromIconName(icon.name)
        prefixSelected.value = prefix ?? noPrefix
    }

    return {
        ensureAllLoaded,
        getDataByIconId,
        clearItems,
        prefixes,
        prefixedIcons,
        prefixSelected,
        ensurePrefixSelectedValid,
        enforcePrefixSelectedTo
    }
})