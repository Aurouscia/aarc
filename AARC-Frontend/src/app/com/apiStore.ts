import axios, { CanceledError } from "axios";
import { defineStore, storeToRefs } from "pinia";
import { useUniqueComponentsStore } from "../globalStores/uniqueComponents";
import { ref } from "vue";
import * as api from "./apiGenerated";
import { getTypeName as tn } from "@/utils/lang/getTypeName";
import { AllFuncsReturnTypeOptional } from "@/utils/type/AllFuncsReturnTypeOptional";

const jwtTokenStorageKey = "aarcAuthToken"
const timeoutMs = 16*1000
export const apiCancelableMs = 4 * 1000
export const apiWaitKeyPrefix = 'api-'
export const useApiStore = defineStore('api', () => {
    //初始化时，从localStorage中读取token
    const jwtToken = ref<string|null|undefined>(localStorage.getItem(jwtTokenStorageKey))
    const clearJwtToken = ()=>{
        jwtToken.value = undefined;
        localStorage.removeItem(jwtTokenStorageKey);
    }
    const setJwtToken = (token:string)=>{
        jwtToken.value = token;
        localStorage.setItem(jwtTokenStorageKey, token);
    }
    const instance = axios.create({
        //https://github.com/RicoSuter/NSwag/issues/3294 提供的workaround
        //看起来没用，但删掉就会报错，因为axios默认会json.parse，但生成的api.ts会再parse一次
        //所以这里的transformResponse必须覆盖默认行为
        transformResponse: data => data
    })
    const { pop, wait } = storeToRefs(useUniqueComponentsStore())

    const userAbortReason = 'http用户取消'
    let activeAbortCs:AbortController[] = []
    function cleanAbortControllers(){
        // 清除已abort的controller，避免内存泄漏
        activeAbortCs = activeAbortCs.filter(x=>!x.signal.aborted)
    }
    function abortAll(){
        activeAbortCs.forEach(x=>x.abort(userAbortReason))
        activeAbortCs = []
    }

    instance.interceptors.request.use(config => {
        if (jwtToken.value) {
            config.headers.Authorization = `Bearer ${jwtToken.value}`
        }
        //设置超时机制（若已有signal则不设置）
        if(!config.signal){
            const abortC = new AbortController()
            const abortS = abortC.signal
            activeAbortCs.push(abortC)
            window.setTimeout(()=>{abortC.abort('http超时取消')}, timeoutMs)
            config.signal = abortS
        }
        return config
    })
    instance.interceptors.response.use(response => {
        cleanAbortControllers()
        return response
    }, error=>{
        cleanAbortControllers()
        //此处必须返回一个reject的promise，否则会被axios认为成功处理了
        return Promise.reject(error)
    })

    const baseUrl = import.meta.env.VITE_ApiUrlBase;
    function wrapClientWithHandling<T extends object>(client:T){
        const clientName = tn(client)?.replace('Client', '')
        return new Proxy<T>(client, {
            get(target, prop, receiver) {
                const originalMethod = Reflect.get(target, prop, receiver);
                if (typeof originalMethod === 'function') {
                    const action = prop.toString()
                    const path = `${clientName}/${action}`
                    const waitKey = apiWaitKeyPrefix+path
                    return async function (...args: any[]) {
                        try {
                            wait.value?.setShowing(waitKey, true)
                            console.log(`[http]开始：${path}\n`,args)
                            const methodRes = await originalMethod.apply(client, args);
                            let methodResLog = methodRes
                            if(typeof methodResLog === 'string' && methodResLog.length>100)
                                methodResLog = methodResLog.slice(0,100)+'...'
                            console.log(`[http]完成：${path}\n`,methodResLog)
                            return methodRes
                        }
                        catch (error) {
                            if (error instanceof api.ApiException) {
                                let errmsg = error.response
                                if (error.status === 401) {
                                    clearJwtToken()
                                    errmsg = '请登录'
                                }
                                else if(error.status === 403){
                                    if(!errmsg)
                                        errmsg = '无权限'
                                }
                                else if(error.status>=400 && error.status<500){
                                    if(!errmsg)
                                        errmsg = '操作非法'
                                }
                                else if(error.status === 500){
                                    if(!errmsg)
                                        errmsg = '发生异常，请联系管理员'
                                }
                                if(!errmsg)
                                    errmsg='未知错误'
                                console.error(`[http]异常：${path}\n`, errmsg)
                                pop.value?.show(errmsg, 'failed')
                            }
                            else if(
                                error instanceof CanceledError 
                                && error.config?.signal instanceof AbortSignal
                                && error.config.signal.reason === userAbortReason)
                            {
                                console.error(`[http]取消：${path}`)
                                pop.value?.show('已取消', 'failed')
                            }
                            else{
                                console.error(error)
                                pop.value?.show(`网络异常`, 'failed')
                            }
                            //外部调用代码应该通过判断返回值的truthiness来判断是否发生了错误
                            return undefined
                        }
                        finally{
                            wait.value?.setShowing(waitKey, false)
                        }
                    }
                }
            }
        }) as AllFuncsReturnTypeOptional<T> //所有函数都可能返回undefined类型（遇到api错误）
    }

    const w = wrapClientWithHandling
    const auth = w(new api.AuthClient(baseUrl, instance))
    const user = w(new api.UserClient(baseUrl, instance))
    const save = w(new api.SaveClient(baseUrl, instance))

    return {
        abortAll,
        setJwtToken,
        clearJwtToken,
        auth,
        user,
        save
    }
})