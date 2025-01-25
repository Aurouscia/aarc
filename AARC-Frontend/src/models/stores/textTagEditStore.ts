import { defineStore, storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useSaveStore } from "./saveStore";
import { LineType, TextOptions, TextTag } from "../save";
import { useConfigStore } from "./configStore";

export const useTextTagEditStore = defineStore('textTagEdit', ()=>{
    const saveStore = useSaveStore()
    const cs = useConfigStore()
    const { deletedTextTag } = storeToRefs(saveStore)
    deletedTextTag.value = disposedTextTagHandler
    const targetId = ref<number>()
    const target = ref<TextTag>()
    const textMain = ref<string>()
    const textSub = ref<string>()
    const edited = ref(false)
    const editing = ref(false)
    const textInputFocusHandler = ref<()=>void>()
    const textEditorDiv = ref<HTMLDivElement>()
    const options = ref<TextOptions>()
    function startEditing(textTagId:number){
        endEditing()
        const tt = saveStore.getTextTagById(textTagId)
        if(!tt)
            return
        target.value = tt
        targetId.value = textTagId
        textMain.value = tt.text
        textSub.value = tt.textS
        editing.value = true
    }
    function applyText(){
        const tt = target.value
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
        target.value = undefined
        options.value = undefined
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
    const editingForType = computed<'common'|'terrain'|undefined>(()=>{
        const forId = target.value?.forId
        if(!forId)
            return
        const forLine = saveStore.getLineById(forId)
        if(forLine){
            if(forLine.type === LineType.common)
                return 'common'
            if(forLine.type === LineType.terrain)
                return 'terrain'
        }
    })

    function textInputClickHandler(type:'main'|'sub'){
        if(!target.value)
            return
        if(type=='main'){
            if(!target.value.textOp) 
                target.value.textOp = { size:1, color: cs.config.textTagFontColorHex }
            options.value = target.value.textOp
        }
        else{
            if(!target.value.textSOp)
                target.value.textSOp = { size:1, color: cs.config.textTagSubFontColorHex }
            options.value = target.value.textSOp
        }
    }
    return { targetId, target, textMain, textSub, editing, edited, editingForType, options,
        startEditing, endEditing, toggleEditing, applyText,
        textInputFocusHandler, textInputClickHandler,
        textEditorDiv, getEditorDivEffectiveHeight
    }
})