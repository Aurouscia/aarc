import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * 加载前将loadedSave设为true，表示当前内存状态“已用过”  
 * 在Editor组件的onBeforeMount中，检查是loadedSave是否truthy，如果是则立即刷新，确保内存状态全新
 */
export const useLoadedSave = defineStore('loadedSave', ()=>{
    const loadedSave = ref<boolean>()
    return { loadedSave }
})