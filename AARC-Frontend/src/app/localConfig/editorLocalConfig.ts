import { defineStore } from "pinia";
import { ref } from "vue";
import { localConfigKeyPrefix } from "./common/keyPrefix";

export const useEditorLocalConfigStore = defineStore('editorLocalConfig',()=>{
    const staNameFob = ref<number|string>()

    //旧版兼容性
    function backCompat(){
        const legacyStaNameFobKey = 'localConfig_editor_staNameFob'
        const legacyStaNameFob = localStorage.getItem(legacyStaNameFobKey)
        if(legacyStaNameFob){
            staNameFob.value = legacyStaNameFob
        }
        localStorage.removeItem(legacyStaNameFobKey)
    }

    return {
        staNameFob,
        backCompat
    }
},
{
    persist:{
        key: `${localConfigKeyPrefix}-editor`
    }
})