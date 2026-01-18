import { Save } from "@/models/save";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useSaveStore } from "../saveStore";
import rfdc from "rfdc";
import { useResetterStore } from "./resetterStore";
import { useUniqueComponentsStore } from "@/app/globalStores/uniqueComponents";

const clone = rfdc()
export const useStashStore = defineStore('stash', ()=>{
    const { showPop } = useUniqueComponentsStore()
    const saveStore = useSaveStore()
    const resetterStore = useResetterStore()
    const s = ref<Save>()
    const lineCount = ref(0)
    const staCount = ref(0)
    const time = ref(0)
    
    function freeze(){
        if(s.value){
            const mins = getTimeSpanMins()
            if(!window.confirm(`暂存只有一份，确定要覆盖当前暂存（${mins}分钟前）的状态？`)){
                return
            }
        }
        s.value = clone(saveStore.save)
        lineCount.value = saveStore.getLineCount()
        staCount.value = saveStore.getStaCount()
        time.value = Date.now()
        showPop('已暂存', 'success')
    }
    async function thaw(){
        if(s.value){
            const mins = getTimeSpanMins()
            if(window.confirm(`确定要丢弃当前改动，还原为暂存时（${mins}分钟前）的状态？`)){
                saveStore.save = clone(s.value)
                resetterStore.resetDerivedStores()
                await resetterStore.relaunchDerivedStores()
                showPop('已还原', 'success')
            }
        }
    }
    const thawable = computed(()=>!!s.value)
    function getTimeSpanMins(){
        let mins = Math.ceil((Date.now() - time.value)/1000/60)
        return mins
    }

    return {
        freeze,
        thaw,
        thawable
    }
})