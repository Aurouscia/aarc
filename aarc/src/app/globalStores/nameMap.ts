import { defineStore } from "pinia";
import { useApiStore } from "../com/apiStore";
import { ref } from "vue";
import { timestampMS } from "@/utils/timeUtils/timestamp";

type MapName = 'userNameMap'|'userGroupNameMap'
const staleMs = 5 * 60 * 1000

export const useNameMapStore = defineStore('nameMap', ()=>{
    const api = useApiStore()

    // value: [name, loadedAtTimestamp] — 每个 id 独立记录加载时间戳
    const userNameMap = ref<Map<number, [string, number]>>(new Map())
    const userGroupNameMap = ref<Map<number, [string, number]>>(new Map())

    const maps = {userNameMap, userGroupNameMap}

    // 用于防止并发请求重复加载相同的 ids
    // key: MapName, value: 正在进行的请求 Promise
    const pendingRequests = new Map<MapName, Promise<void>>()

    function isStale(entry: [string, number]): boolean {
        return timestampMS() - entry[1] > staleMs
    }

    async function ensureLoaded(on: MapName, ids:number[]) {
        const m = maps[on]
        const idsSet = new Set(ids)

        // 等待之前的同类型请求完成，避免并发重复请求
        const prevRequest = pendingRequests.get(on)
        if(prevRequest){
            await prevRequest
        }

        // 过滤出需要加载的 id：不存在或已过期
        for(const [id, entry] of m.value){
            if(!isStale(entry)){
                idsSet.delete(id)
            }
        }
        if(idsSet.size === 0){
            return
        }

        const currentRequest = (async () => {
            let res: {id?:number, name?:string}[]|undefined
            if(on == 'userNameMap')
                res = await api.user.quickDisplay([...idsSet])
            else if(on == 'userGroupNameMap')
                throw new Error('not implemented')
            if(res){
                const now = timestampMS()
                for(const item of res){
                    if(item.id && item.name)
                        m.value.set(item.id, [item.name, now])
                }
            }
        })()

        pendingRequests.set(on, currentRequest)
        try{
            await currentRequest
        }finally{
            // 只有当前请求仍是 pending 中的那个时才清除
            if(pendingRequests.get(on) === currentRequest){
                pendingRequests.delete(on)
            }
        }
    }

    function appendToMap(on: MapName, id:number, name:string){
        const m = maps[on]
        m.value.set(id, [name, timestampMS()])
    }

    /** 获取名称（自动处理 [string, Date] 结构） */
    function getName(on: 'userNameMap', id: number): string | undefined
    function getName(on: 'userGroupNameMap', id: number): string | undefined
    function getName(on: MapName, id: number): string | undefined {
        const entry = maps[on].value.get(id)
        if(!entry) return undefined
        return entry[0]
    }

    return { userNameMap, userGroupNameMap, ensureLoaded, appendToMap, getName }
})
