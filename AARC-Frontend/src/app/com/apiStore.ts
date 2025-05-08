import axios from "axios";
import { defineStore, storeToRefs } from "pinia";
import { useUniqueComponentsStore } from "../globalStores/uniqueComponents";
import { ref } from "vue";
import * as api from "./apiGenerated";
import { getTypeName as tn } from "@/utils/lang/getTypeName";
import { AllFuncsReturnTypeOptional } from "@/utils/type/AllFuncsReturnTypeOptional";

const jwtTokenStorageKey = "aarcAuthToken"
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
    instance.interceptors.request.use(config => {
        if (jwtToken.value) {
            config.headers.Authorization = `Bearer ${jwtToken.value}`
        }
        return config
    })
    instance.interceptors.response.use(response => {
        if (response.headers.authorization) {
            jwtToken.value = response.headers.authorization
        }
        return response
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
                    const waitKey = 'api-'+path
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
                                console.error(`[http]异常：${path}\n`, errmsg)
                                pop.value?.show(errmsg, 'failed')
                            }else{
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
        setJwtToken,
        clearJwtToken,
        auth,
        user,
        save
    }
})