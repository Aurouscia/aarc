import { HttpUserInfo, LoginResponse, UserDto } from "@/pages/identities/models/models";
import { HttpClient, useHttpClientStore } from "./httpClient";
import { defineStore } from "pinia";
import { shallowRef } from "vue";
import { SaveDto } from "@/pages/saves/models/models";

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
        login: async (username:string, password:string, expireHrs:number)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('auth', 'login'),
                'postForm',
                {username, password, expireHrs},
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
    user = {
        index: async (search?:string)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('user', 'index'),
                'postForm',
                { search },
                undefined,
                true
            )
            if(resp.Success){
                return resp.Data as UserDto[]
            }
        },
        add: async (username:string, password:string)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('user', 'add'),
                'postForm',
                {username, password},
                '注册成功',
                true
            )
            return resp.Success
        },
        update: async (user:UserDto)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('user', 'update'),
                'postJson',
                user,
                '编辑成功',
                true
            )
            return resp.Success
        },
        getInfo: async(id:number)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('user', 'getInfo'),
                'postForm',
                {id},
                undefined
            )
            if(resp.Success)
                return resp.Data as UserDto
        },
    }
    save = {
        getNewestSaves: async()=>{
            const resp = await this.httpClient.request(
                this.apiUrl('save', 'getNewestSaves'),
                'get'
            )
            if(resp.Success)
                return resp.Data as SaveDto[]
        },
        getMySaves: async(uid:number)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('save', 'getMySaves'),
                'get',
                {uid},
                undefined,
                true
            )
            if(resp.Success)
                return resp.Data as SaveDto[]
        },
        add: async(saveDto:SaveDto)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('save', 'add'),
                'postForm',
                saveDto,
                '创建成功',
                true
            )
            return resp.Success
        },
        updateInfo: async(saveDto:SaveDto)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('save', 'updateInfo'),
                'postForm',
                saveDto,
                '编辑成功',
                true
            )
            return resp.Success
        },
        updateData: async(id:number, data:string, staCount:number, lineCount:number)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('save', 'updateData'),
                'postForm',
                {id, data, staCount, lineCount},
                '已保存',
                true
            )
            return resp.Success
        },
        updateMiniature: async(id:number, mini:Blob)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('save', 'updateMiniature'),
                'postForm',
                {id, mini},
            )
            return resp.Success
        },
        loadInfo: async(id:number)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('save', 'loadInfo'),
                'get',
                {id},
                undefined,
                true
            )
            if(resp.Success)
                return resp.Data as SaveDto
        },
        loadData: async(id:number)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('save', 'loadData'),
                'get',
                {id},
                undefined,
                true
            )
            return resp.Data as string
        },
        remove: async(id:number)=>{
            const resp = await this.httpClient.request(
                this.apiUrl('save', 'remove'),
                'postForm',
                {id},
                '删除成功',
                true
            )
            return resp.Success
        }
    }
}