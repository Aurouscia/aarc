import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useSaveStore } from "./saveStore";
import { useConfigStore } from "./configStore";

export const useNameEditStore = defineStore('nameEdit', ()=>{
    const cs = useConfigStore()
    const saveStore = useSaveStore()
    const { disposedStaNameOf } = storeToRefs(saveStore)
    disposedStaNameOf.value = disposedStaNameHandler
    const targetPtId = ref<number>()
    const nameMain = ref<string>()
    const nameSub = ref<string>()
    const edited = ref(false)
    const editing = ref(false)
    const nameInputFocusHandler = ref<()=>void>()
    const nameEditorDiv = ref<HTMLDivElement>()
    function startEditing(ptId:number){
        endEditing()
        if(saveStore.isPtNoSta(ptId))
            return
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
            if(!edited.value){
                edited.value = nameMain.value !== pt.name || nameSub.value !== pt.nameS
            }
            pt.name = nameMain.value
            pt.nameS = nameSub.value
            if(saveStore.isNamedPt(pt) && !pt.nameP){
                const dist = cs.config.snapOctaClingPtNameDist
                pt.nameP = [0, dist]
            }
        }
    }
    function disposedStaNameHandler(ptId:number){
        if(targetPtId.value == ptId){
            targetPtId.value = -1
            nameMain.value = undefined
            nameSub.value = undefined
            editing.value = false;
            edited.value = false;
        }
    }

    function endEditing(){
        if(!editing.value){
            return
        }
        applyName()
        editing.value = false;
        edited.value = false;
    }
    function toggleEditing(ptId:number){
        if(editing.value){
            endEditing()
        }else{
            startEditing(ptId)
        }
    }
    function getEditorDivEffectiveHeight(){
        if(!editing.value)
            return 0
        return nameEditorDiv.value?.clientHeight || 0
    }
    return { targetPtId, nameMain, nameSub, editing, edited,
        startEditing, endEditing, toggleEditing, applyName,
        nameInputFocusHandler, nameEditorDiv, getEditorDivEffectiveHeight
    }
})