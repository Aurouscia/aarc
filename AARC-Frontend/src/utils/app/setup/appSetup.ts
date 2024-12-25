import { storeToRefs } from "pinia";
import { HttpCallBack, HttpClient, useHttpClientStore } from "../com/httpClient";
import { useUniqueComponentsStore } from "../globalStores/uniqueComponents";
import { routerSetup } from "../router/routerSetup";
import { createRouter, createWebHashHistory } from "vue-router";

export function appSetup(){
    const httpClientStore = useHttpClientStore()
    const uniqueComponentsStore = useUniqueComponentsStore()
    const { pop, wait } = storeToRefs(uniqueComponentsStore)

    const httpCallBack: HttpCallBack = (result, msg) => {
        if (result == 'ok') { pop.value?.show(msg, 'success') }
        else if (result == 'err') { pop.value?.show(msg, 'failed') }
        else if (result == 'warn') { pop.value?.show(msg, 'warning') }
    }
    const showWait = (s:boolean)=>{
        wait.value?.setShowing(s)
    }

    const httpClient = new HttpClient(
        httpCallBack,
        ()=>console.log('unauthorized'),
        ()=>console.log('needMember'),
        showWait
    )
    httpClientStore.init(httpClient)

    const router = createRouter({
        history: createWebHashHistory(),
        routes:[]
    })
    routerSetup(router)
    return router
}