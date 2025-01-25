import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useSaveStore } from "./saveStore";

export const useTextTagEditStore = defineStore('textTagEdit', ()=>{
    const saveStore = useSaveStore()
    const { deletedTextTag } = storeToRefs(saveStore)
    deletedTextTag.value = disposedTextTagHandler
    const targetId = ref<number>()
    const textMain = ref<string>()
    const textSub = ref<string>()
    const edited = ref(false)
    const editing = ref(false)
    const textInputFocusHandler = ref<()=>void>()
    const textEditorDiv = ref<HTMLDivElement>()
    function startEditing(textTagId:number){
        endEditing()
        const tt = saveStore.getTextTagById(textTagId)
        if(!tt)
            return
        targetId.value = textTagId
        textMain.value = tt.text
        textSub.value = tt.textS
        editing.value = true
    }
    function applyText(){
        const tt = saveStore.getTextTagById(targetId.value || -1)
        if(tt){
            if(!edited.value){
                edited.value = textMain.value !== tt.text || textSub.value !== tt.textS
            }
            tt.text = textMain.value
            tt.textS = textSub.value
        }
    }
    function disposedTextTagHandler(textTagId:number){
        if(targetId.value === textTagId){
            targetId.value = -1
            textMain.value = undefined
            textSub.value = undefined
            editing.value = false;
            edited.value = false;
        }
    }

    function endEditing(){
        if(!editing.value){
            return
        }
        applyText()
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
        return textEditorDiv.value?.clientHeight || 0
    }
    return { targetId, textMain, textSub, editing, edited,
        startEditing, endEditing, toggleEditing, applyText,
        textInputFocusHandler, textEditorDiv, getEditorDivEffectiveHeight
    }
})