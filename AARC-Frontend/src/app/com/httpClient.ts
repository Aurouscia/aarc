import axios, { Axios, AxiosResponse } from 'axios'
import {AxiosError} from 'axios'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useHttpClientStore = defineStore('httpClient', ()=>{
    const httpClient = shallowRef<HttpClient>()
    function get():HttpClient{
        if(httpClient.value)
            return httpClient.value
        throw Error('httpClientStore未初始化')
    }
    function init(instance:HttpClient):void{
        httpClient.value = instance
    }
    function clearToken(){
        get().clearToken()
    }
    return { get, init, clearToken }
})

export class HttpClient{
    jwtToken:string|null=null
    httpCallBack:HttpCallBack
    unauthorizeCallBack:()=>void
    needMemberCallBack:()=>void
    showWaitCallBack:(s:boolean)=>void
    ax:Axios
    constructor(httpCallBack:HttpCallBack, unauthorizeCallBack:()=>void, needMemberCallBack:()=>void, showWait:(s:boolean)=>void){
        this.jwtToken = localStorage.getItem(storageKey);
        this.httpCallBack = httpCallBack;
        this.unauthorizeCallBack = unauthorizeCallBack;
        this.needMemberCallBack = needMemberCallBack;
        this.showWaitCallBack = showWait;
        this.ax = axios.create({
            baseURL: import.meta.env.VITE_ApiUrlBase,
            validateStatus: (n)=>n < 500
          });
    }
    setToken(token:string){
        this.jwtToken = token;
        localStorage.setItem(storageKey,token);
    }
    clearToken(){
        this.jwtToken = null;
        localStorage.removeItem(storageKey);
    }
    private headers(){
        return {
            Authorization: `Bearer ${this.jwtToken}`
        }
    }
    private showErrToUser(err:AxiosError){
        console.log(err);
        if(err.status){
            const codeText = this.statusCodeText(err.status);
            if(codeText){
                this.httpCallBack("err", codeText);
                return;
            }
        }
        this.httpCallBack("err","请检查网络连接");
    }
    async request(resource:string, type:RequestType, data?:any, successMsg?:string, showWait?:boolean): Promise<ApiResponse>{
        console.log(`开始发送[${type}]=>[${resource}]`,data)
        let res:AxiosResponse|undefined = undefined;
        if(showWait)
            this.showWaitCallBack(true);
        try{
            if(type=='get'){
                res = await this.ax.get(
                    resource,
                    {
                        params:data,
                        headers:this.headers(),
                    }
                );
            }else if(type=='postJson'){
                res = await this.ax.post(
                    resource,
                    data,
                    {
                        headers:this.headers()
                    }
                );
            }else if(type=='postForm'){
                res = await this.ax.postForm(resource,
                    data,
                    {
                        headers:this.headers()
                    }
                );
            }else if(type=='download'){
                res = await this.ax.get(resource,
                    {
                        params: data,
                        headers:this.headers(),
                        responseType: 'blob'
                    }
                );
            }
            if(showWait)
                this.showWaitCallBack(false);
        }
        catch(ex){
            if(showWait)
                this.showWaitCallBack(false);
            const err = ex as AxiosError;
            console.log(`[${type}]${resource}失败`,err)
            this.showErrToUser(err);
        }
        if (res) {
            if (res.status == 401) {
                this.httpCallBack("err","请登录")
                this.unauthorizeCallBack()
                return defaultFailResp;
            }
            if (res.status == 429){
                this.httpCallBack("err", "操作频率过高，请稍后再试")
                return defaultFailResp
            }

            let resp: ApiResponse|undefined = undefined;
            if (this.isApiResponseObj(res.data)) {
                resp = res.data as ApiResponse;
            } else {
                resp = {
                    Success: true,
                    Errmsg: '',
                    Code: 0,
                    Data: res.data,
                }
            }
            if (resp.Success) {
                const logData = (type!=='download' && (!resp.Data || resp.Data.length < 200)) ? resp.Data : resp.Data.length
                console.log(`[${type}]${resource}成功`, logData)
                if (successMsg) {
                    this.httpCallBack('ok', successMsg)
                }
            }
            if (!resp.Success) {
                console.log(`[${type}]${resource}失败`, resp.Errmsg || res.statusText);
                if (resp.Errmsg) {
                    this.httpCallBack('err', resp.Errmsg);
                } else {
                    const codeText = this.statusCodeText(res.status);
                    this.httpCallBack('err', codeText || "未知错误")
                }
            }
            if (resp.Code == ApiResponseCodes.NoTourist) {
                this.needMemberCallBack()
            }
            return resp;
        }
        return defaultFailResp;
    }
    statusCodeText(code:number|undefined|null){
        if(code == 401){
            return "请登录";
        }
        if(code == 403){
            return "无权限";
        }
        if(code||0 >= 500){
            return "服务器未知错误";
        }
        return undefined;
    }
    private isApiResponseObj(obj:any){
        if(!obj)
            return false
        const ownPropNames = Object.getOwnPropertyNames(obj)
        const c = (propName:keyof ApiResponse)=>{
            return ownPropNames.includes(propName)
        }
        if(typeof obj == 'object'){
            return c('Code') && c('Success') && c('Errmsg')
        }
    }
}

export type ApiResponse = {
    Success: boolean
    Data: any
    Errmsg: string
    Code: number
}
export type RequestType = "get"|"postJson"|"postForm"|"download";

export type HttpCallBack = (result:"ok"|"warn"|"err",msg:string)=>void
export interface ApiRequestHeader{
    Authorization:string|undefined
}

export const ApiResponseCodes = 
{
    Normal: 0,
    NoTourist: 70827
}

const storageKey = "aarcAuthToken"
const defaultFailResp:ApiResponse = {Data:undefined,Success:false,Errmsg:"失败",Code:0}