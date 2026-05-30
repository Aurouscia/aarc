import { defineStore } from "pinia";
import { ref } from "vue";
import { localConfigKeyPrefix } from "./common/keyPrefix";

export type SaveListOrderBy = 'active'|'sta'
export const defaultOrderby:SaveListOrderBy = 'sta'
export type AutoRefreshNewest = true | false | 'auto'
export const defaultAutoRefreshNewest: AutoRefreshNewest = 'auto'

export const useSaveListLocalConfigStore = defineStore('saveListLocalConfig', ()=>{
    const searchOrderby = ref<SaveListOrderBy>(defaultOrderby)
    const autoRefreshNewest = ref<AutoRefreshNewest>(defaultAutoRefreshNewest)
    return {
        searchOrderby,
        autoRefreshNewest
    }
},
{
    persist:{
        key: `${localConfigKeyPrefix}-saveList`
    }
})