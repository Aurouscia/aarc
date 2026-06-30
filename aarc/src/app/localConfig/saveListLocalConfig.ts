import { defineStore } from "pinia";
import { ref } from "vue";
import { localConfigKeyPrefix } from "./common/keyPrefix";

export type SaveListOrderBy = 'active'|'sta'
export const defaultOrderby:SaveListOrderBy = 'sta'
export type AutoRefreshNewest = true | false | 'auto'
export const defaultAutoRefreshNewest: AutoRefreshNewest = 'auto'

export type FolderOrderBy = 'active' | 'name' | 'custom'
export const defaultFolderOrderby: FolderOrderBy = 'custom'

export const useSaveListLocalConfigStore = defineStore('saveListLocalConfig', ()=>{
    const searchOrderby = ref<SaveListOrderBy>(defaultOrderby)
    const autoRefreshNewest = ref<AutoRefreshNewest>(defaultAutoRefreshNewest)
    const folderOrderby = ref<FolderOrderBy>(defaultFolderOrderby)
    const simpleCoopRulesDisplay = ref<boolean>(true)
    const readRuleCommentIds = ref<Record<number, number>>({})
    const favoriteGroup = ref<string>('')
    return {
        searchOrderby,
        autoRefreshNewest,
        folderOrderby,
        simpleCoopRulesDisplay,
        readRuleCommentIds,
        favoriteGroup
    }
},
{
    persist:{
        key: `${localConfigKeyPrefix}-saveList`
    }
})