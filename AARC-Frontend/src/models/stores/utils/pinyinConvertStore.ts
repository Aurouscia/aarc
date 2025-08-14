import { useApiStore } from "@/app/com/apiStore";
import { defineStore } from "pinia";

export const usePinyinConvertStore = defineStore('pinyinConvert', ()=>{
    const api = useApiStore()
    async function convertPinyin(text?:string|null){
        if(!text)
            return
        const res = await api.saveUtils.pinyinConvert({text})
        return res
    }
    return {
        convertPinyin
    }
})