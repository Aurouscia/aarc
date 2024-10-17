import { defineStore } from "pinia";
import { ref } from "vue";
import { useSaveStore } from "./saveStore";

export const useNameEditStore = defineStore('nameEdit', ()=>{
    const saveStore = useSaveStore()
    const targetPtId = ref<number>()
    const nameMain = ref<string>()
    const nameSub = ref<string>()
    const editing = ref(false)
    function startEditing(ptId:number){
        endEditing()
        if(editing.value && targetPtId.value == ptId){
            return
        }
        const pt = saveStore.getPtById(ptId)
        if(pt){
            targetPtId.value = ptId
            nameMain.value = pt.name
            nameSub.value = pt.nameS
            editing.value = true
        }
    }
    function applyName(){
        const pt = saveStore.getPtById(targetPtId.value || -1)
        if(pt){
            pt.name = nameMain.value
            pt.nameS = nameSub.value
        }
    }
    function endEditing(){
        if(!editing.value){
            return
        }
        applyName()
        editing.value = false;
    }
    return { nameMain, nameSub, editing,
        startEditing, endEditing, applyName
    }
})