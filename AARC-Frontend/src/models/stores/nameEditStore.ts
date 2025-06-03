import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useSaveStore } from "./saveStore";
import { useConfigStore } from "./configStore";
import { useStaClusterStore } from "./saveDerived/staClusterStore";
import ControlPointOptions from "@/components/sidebars/options/ControlPointOptions.vue";
import { Coord } from "../coord";

export const useNameEditStore = defineStore('nameEdit', ()=>{
    const cs = useConfigStore()
    const saveStore = useSaveStore()
    const staClusterStore = useStaClusterStore()
    const { disposedStaNameOf } = storeToRefs(saveStore)
    disposedStaNameOf.value = disposedStaNameHandler
    const targetPtId = ref<number>()
    const nameMain = ref<string>()
    const nameSub = ref<string>()
    const edited = ref(false)
    const editing = ref(false)
    const nameInputFocusHandler = ref<()=>void>()
    const nameEditorDiv = ref<HTMLDivElement>()
    const controlPointOptionsPanel = ref<InstanceType<typeof ControlPointOptions>>()
    function startEditing(ptId:number, openOptionsPanel?:boolean){
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
        if(openOptionsPanel){
            controlPointOptionsPanelOpen()
        }
    }
    function controlPointOptionsPanelOpen(forPtId?:number){
        // if(!editing.value)
        //     return
        const pt = saveStore.getPtById(forPtId || targetPtId.value || -1)
        if(!pt)
            return
        if(controlPointOptionsPanel.value){
            controlPointOptionsPanel.value.startEditing(pt)
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
                pt.nameP = newNamePos(pt.id)
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
        //edited不动，因为可能结束编辑后一段时间还要读取是否edited，需要外部读取后重置状态
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

    function newNamePos(ptId:number):Coord{
        const ptSize = staClusterStore.getMaxSizePtWithinCluster(ptId, 'ptSize')
        const dist = cs.config.snapOctaClingPtNameDist * ptSize
        //TODO：自动选择不遮挡线路的位置
        return [0, dist]
    }

    return { targetPtId, nameMain, nameSub, editing, edited,
        startEditing, endEditing, toggleEditing, applyName,
        nameInputFocusHandler, nameEditorDiv, getEditorDivEffectiveHeight,
        controlPointOptionsPanel, controlPointOptionsPanelOpen,
        newNamePos
    }
})