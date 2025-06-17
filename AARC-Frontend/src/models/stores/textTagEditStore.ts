import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useSaveStore } from "./saveStore";
import { LineType, TextOptions, TextTag } from "../save";
import TextTagOptions from "@/components/sidebars/options/TextTagOptions.vue";

export const useTextTagEditStore = defineStore('textTagEdit', ()=>{
    const saveStore = useSaveStore()
    const { deletedTextTag } = storeToRefs(saveStore)
    deletedTextTag.value = disposedTextTagHandler
    const targetId = ref<number>()
    const targetForType = ref<'common'|'terrain'|undefined>()
    const target = ref<TextTag>()
    const textMain = ref<string>()
    const textSub = ref<string>()
    const edited = ref(false)
    const editing = ref(false)
    const textInputFocusHandler = ref<()=>void>()
    const textEditorDiv = ref<HTMLDivElement>()
    const options = ref<TextOptions>()
    const textTagOptionsPanel = ref<InstanceType<typeof TextTagOptions>>()
    function startEditing(textTagId:number, openOptionsPanel?:boolean){
        endEditing()
        const tt = saveStore.getTextTagById(textTagId)
        if(!tt)
            return
        target.value = tt
        targetId.value = textTagId
        targetForType.value = getTargetForType()
        textMain.value = tt.text
        textSub.value = tt.textS
        editing.value = true
        if(openOptionsPanel){
            textTagOptionsPanelOpen()
        }
    }
    function textTagOptionsPanelOpen(){
        if(target.value)
            textTagOptionsPanel.value?.startEditing(target.value)
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
        //edited不动，因为可能结束编辑后一段时间还要读取是否edited，需要外部读取后重置状态
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
    function getTargetForType(){
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
    }

    function clearItems(){
        target.value = undefined
        targetId.value = undefined
        textMain.value = undefined
        textSub.value = undefined
    }

    return { targetId, target, textMain, textSub, editing, edited, targetForType, options,
        startEditing, endEditing, toggleEditing, applyText,
        textInputFocusHandler,
        textEditorDiv, getEditorDivEffectiveHeight,
        textTagOptionsPanel, textTagOptionsPanelOpen,
        clearItems
    }
})