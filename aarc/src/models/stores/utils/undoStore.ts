import { Save } from "@/models/save";
import { AurPatchStore } from "@aurouscia/au-undo-redo";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useSaveStore } from "../saveStore";
import { useResetterStore } from "./resetterStore";

export const useUndoStore = defineStore('undo', ()=>{
    const saveStore = useSaveStore()
    const resetterStore = useResetterStore()
    
    let urPatches: AurPatchStore<Save>|null = null
    const canUndo = ref(false)
    const canRedo = ref(false)

    function initUndo(initialState: Save){
        urPatches = new AurPatchStore(initialState, 50, (canU, canR) => {
            console.log({canU, canR})
            canUndo.value = canU
            canRedo.value = canR
        })
    }

    function push(state: Save){
        if(!urPatches){
            initUndo(state)
            return
        }
        urPatches.push(state)
    }

    async function undo(){
        if(!urPatches || !canUndo.value)
            return
        const state = urPatches.undo()
        if(state){
            await restoreState(state)
        }
    }

    async function redo(){
        if(!urPatches || !canRedo.value)
            return
        const state = urPatches.redo()
        if(state){
            await restoreState(state)
        }
    }

    async function restoreState(state: Save){
        // TODO: activeCvsDispatcher会因为获取不到画布报错一次，有点难看不过问题不大
        saveStore.save = state
        resetterStore.resetDerivedStores()
        await resetterStore.relaunchDerivedStores()
    }

    function clear(){
        urPatches = null
        canUndo.value = false
        canRedo.value = false
    }

    return {
        canUndo: computed(()=>canUndo.value),
        canRedo: computed(()=>canRedo.value),
        push,
        undo,
        redo,
        clear
    }
})
