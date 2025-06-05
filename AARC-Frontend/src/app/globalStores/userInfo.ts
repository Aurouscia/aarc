import { defineStore } from "pinia"
import { useApiStore } from "../com/apiStore"
import { computed, ref } from "vue"
import { timestampMS } from "@/utils/timeUtils/timestamp"
import { HttpUserInfo, UserType } from "../com/apiGenerated"


export const useUserInfoStore = defineStore('userInfo', ()=>{
    const userInfo = ref(defaultValue)
    const isAdmin = computed<boolean>(()=>(userInfo.value.type??0)>=UserType.Admin)
    const apiStore = useApiStore()

    /**
     * 获取身份信息（确保最新（检查缓存是否过期））
     * @param enforceNew 强制从服务器获取，不读缓存
     */
    async function getIdentityInfo(enforceNew?:boolean):Promise<HttpUserInfo> {
        let res:HttpUserInfo|undefined = undefined
        if(!enforceNew)
            res = readCache()?.info;
        if(!res){
            res = await apiStore.auth.info()
            if (res) {
                log("获取服务器响应:", res)
            }
            else{
                res = defaultValue;
            }
            setCache(res)
        }
        else{
            log("获取缓存:",res)
        }
        userInfo.value = res
        return res;
    }

    function clearCache(){
        localStorage.removeItem(localStorageKey);
        userInfo.value = defaultValue;
        log("清除缓存")
    }
    function readCache():{update:number,info:HttpUserInfo}|undefined{
        const stored = localStorage.getItem(localStorageKey);
        if(stored){
            const data = JSON.parse(stored)
            if(data.update && data.info && typeof data.update==='number'){
                if(timestampMS() - identityCacheExpireMs < (data.update as number)) //缓存未过期
                    return data;
            }
        }
    }
    function setCache(info:HttpUserInfo){
        const stored = {
            update: timestampMS(),
            info: info
        };
        localStorage.setItem(localStorageKey, JSON.stringify(stored));
    }

    //TODO：过段时间删除下面这行和旧key
    localStorage.removeItem(localStorageKeyLegacy);

    return { userInfo, isAdmin, getIdentityInfo, clearCache }
})


const localStorageKeyLegacy = "aarcUserInfo";
const localStorageKey = "aarc-userInfo";
const logPrefix = "[身份信息]"
const log = (msg:string, ...data:any[])=>console.log(`${logPrefix}${msg}`, ...data)
const defaultValue:HttpUserInfo = {
    name:"游客",
    id:0,
    leftHours:0,
    type: UserType.Tourist
}
const identityCacheExpireSec = 60 //一分钟内刷新不再重复获取，直接读取缓存
const identityCacheExpireMs = identityCacheExpireSec * 1000
export { defaultValue as defaultIdentity }