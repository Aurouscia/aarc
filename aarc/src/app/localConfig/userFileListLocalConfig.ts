import { defineStore } from "pinia";
import { ref } from "vue";
import { localConfigKeyPrefix } from "./common/keyPrefix";

export type UserFileListOrderBy = 'time' | 'name'
export const defaultOrderby: UserFileListOrderBy = 'time'

export const useUserFileListLocalConfigStore = defineStore('userFileListLocalConfig', () => {
    const orderby = ref<UserFileListOrderBy>(defaultOrderby)
    return {
        orderby
    }
},
{
    persist: {
        key: `${localConfigKeyPrefix}-userFileList`
    }
})
