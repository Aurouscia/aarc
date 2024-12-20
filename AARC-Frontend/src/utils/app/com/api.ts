import { HttpUserInfo, LoginResponse } from "@/pages/identities/identitesModels";
import { HttpClient, useHttpClientStore } from "./httpClient";
import { defineStore } from "pinia";
import { shallowRef } from "vue";

export const useApiStore = defineStore('api', ()=>{
    const httpClientStore = useHttpClientStore()
    const api = shallowRef<Api>()
    function get(){
        if(api.value)
            return api.value
        api.value = new Api(httpClientStore.get())
        return api.value
    } 
    return { get }
})

export class Api{
    private httpClient: HttpClient;
    constructor(httpClient:HttpClient){
        this.httpClient = httpClient;
    }
    private apiUrl(controller:string, action:string) {
        return `/api/${controller}/${action}`
    }
    auth = {
        login: async (username:string, password:string)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('auth', 'login'),
                'postForm',
                {username, password},
                '登录成功',
                true
            )
            if(resp.Success)
                return resp.Data as LoginResponse
        },
        info: async()=>{
            const resp = await this.httpClient.request(
                this.apiUrl('auth', 'info'),
                'get'
            )
            if(resp.Success)
                return resp.Data as HttpUserInfo
        }
    }
}