import { defineStore } from "pinia";
import { LocalConfig } from "./common/localConfig";

export type UserListOrderBy = 'active'|'save'
export const defaultOrderby:UserListOrderBy = 'active'
class UserListLocalConfig extends LocalConfig{
    protected storageSectorName(): string {
        return 'userList'
    }
    private readonly orderbyKey = 'orderby'
    readOrderby(){
        return (this.readLocalConfig(this.orderbyKey) || 'active') as UserListOrderBy
    }
    saveOrderby(orderby:UserListOrderBy){
        this.saveLocalConfig(this.orderbyKey, orderby)
    }
}

export const useUserListLocalConfigStore = defineStore('userListLocalConfig',()=>{
    const cfg = new UserListLocalConfig()
    return {
        readOrderby: () => cfg.readOrderby(),
        saveOrderby: (orderby:UserListOrderBy) => cfg.saveOrderby(orderby),
        defaultOrderby
    }
})