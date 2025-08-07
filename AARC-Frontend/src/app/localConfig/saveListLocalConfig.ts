import { defineStore } from "pinia";
import { ref } from "vue";
import { localConfigKeyPrefix } from "./common/keyPrefix";

export type SaveListOrderBy = 'active'|'sta'
export const defaultOrderby:SaveListOrderBy = 'active'

export const useSaveListLocalConfigStore = defineStore('saveListLocalConfig', ()=>{
    const searchOrderby = ref<SaveListOrderBy>(defaultOrderby)
    return {
        searchOrderby
    }
},
{
    persist:{
        key: `${localConfigKeyPrefix}-saveList`
    }
})