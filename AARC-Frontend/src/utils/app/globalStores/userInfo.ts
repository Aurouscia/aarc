import { defineStore } from "pinia"
import { useApiStore } from "../com/api"
import { computed, ref } from "vue"
import { timestampS } from "@/utils/timeUtils/timestamp"
import { HttpUserInfo, UserType } from "@/pages/identities/identitesModels"


export const useUserInfoStore = defineStore('userInfo', ()=>{
    const userInfo = ref(defaultValue)
    const isAdmin = computed<boolean>(()=>userInfo.value.Type>=UserType.Admin)
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
            res = await apiStore.get().auth.info()
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
            if(data.update && data.info){
                if(timestampS() - identityCacheExpireSec < (data.update as number)) //缓存未过期
                    return data;
            }
        }
    }
    function setCache(info:HttpUserInfo){
        const stored = {
            update: timestampS(),
            info: info
        };
        localStorage.setItem(localStorageKey, JSON.stringify(stored));
    }

    return { userInfo, isAdmin, getIdentityInfo, clearCache }
})


const localStorageKey = "identityInfo";
const logPrefix = "[身份信息]"
const log = (msg:string, ...data:any[])=>console.log(`${logPrefix}${msg}`, ...data)
const defaultValue:HttpUserInfo = {
    Name:"游客",
    Id:0,
    LeftHours:0,
    Type: UserType.Tourist
}
const identityCacheExpireSec = 60*60 //一分钟内刷新不再重复获取，直接读取缓存
export { defaultValue as defaultIdentity }