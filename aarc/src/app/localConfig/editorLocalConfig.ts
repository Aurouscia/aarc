import { defineStore } from "pinia";
import { ref } from "vue";
import { localConfigKeyPrefix } from "./common/keyPrefix";

export const useEditorLocalConfigStore = defineStore('editorLocalConfig',()=>{
    const staNameFob = ref<number|string>()
    const tabForPinyinConvert = ref<boolean>(false)
    const duplicateNameDistThrs = ref<number|string>(200)
    const allowMergePtAndTerrain = ref<boolean>(true)
    const ignoreStyleAndSpan = ref<boolean>(false)
    const staNameSnapDiagonal = ref<'inner'|'outer'|'both'>('both')
    const gridLabelSize = ref<number>(0)

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
        tabForPinyinConvert,
        duplicateNameDistThrs,
        allowMergePtAndTerrain,
        ignoreStyleAndSpan,
        staNameSnapDiagonal,
        gridLabelSize,
        backCompat
    }
},
{
    persist:{
        key: `${localConfigKeyPrefix}-editor`
    }
})