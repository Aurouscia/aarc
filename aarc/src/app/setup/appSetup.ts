import { routerSetup } from "../router/routerSetup";
import { createRouter, createWebHashHistory } from "vue-router";
import { useUserInfoStore } from "../globalStores/userInfo";

export function appSetup(){
    const router = createRouter({
        history: createWebHashHistory(),
        routes:[]
    })
    routerSetup(router)

    const userInfoStore = useUserInfoStore()
    userInfoStore.getIdentityInfo()
    return router
}