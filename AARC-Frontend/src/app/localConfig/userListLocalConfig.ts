import { defineStore } from "pinia";
import { ref } from "vue";
import { localConfigKeyPrefix } from "./common/keyPrefix";

export type UserListOrderBy = 'active'|'save'
export const defaultOrderby:UserListOrderBy = 'active'

export const useUserListLocalConfigStore = defineStore('userListLocalConfig',()=>{
    const orderby = ref<UserListOrderBy>()

    //兼容旧版（过段时间可以删了）
    function backCompat(){
        const legacyOrderbyKey = 'localConfig_userList_orderby'
        const legacyOrderby = localStorage.getItem(legacyOrderbyKey)
        if(legacyOrderby){
            orderby.value = legacyOrderby as UserListOrderBy
            localStorage.removeItem(legacyOrderbyKey)
        }
    }

    return {
        orderby,
        backCompat
    }
},
{
    persist:{
        key: `${localConfigKeyPrefix}-userList`
    }
})