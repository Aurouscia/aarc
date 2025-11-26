import { defineStore } from "pinia";
import { useApiStore } from "../com/apiStore";
import { ref } from "vue";
import { timestampMS } from "@/utils/timeUtils/timestamp";

type MapName = 'userNameMap'|'userGroupNameMap'
const staleMs = 5 * 60 * 1000

export const useNameMapStore = defineStore('nameMap', ()=>{
    const api = useApiStore()

    const userNameMap = ref<Map<number, string>>(new Map())
    const userGroupNameMap = ref<Map<number, string>>(new Map())

    const lastCompleteLoaded = new Map<MapName, number>()
    const maps = {userNameMap, userGroupNameMap}
    async function ensureLoaded(on: MapName, ids:number[]) {
        const now = timestampMS()
        const last = lastCompleteLoaded.get(on)
        const m = maps[on]
        // 如果stale时间已经到了，那么清空map，重新加载
        if(last && now - last > staleMs){
            m.value.clear()
            lastCompleteLoaded.set(on, now)
        }
        const notLoaded = ids.filter(id => !m.value.has(id))
        if(notLoaded.length > 0){
            let res: {id?:number, name?:string}[]|undefined
            if(on == 'userNameMap')
                res = await api.user.quickDisplay(notLoaded)
            else if(on == 'userGroupNameMap')
                throw new Error('not implemented')
            if(res){
                for(const item of res){
                    if(item.id && item.name)
                        m.value.set(item.id, item.name)
                }
            }
        }
    }
    function appendToMap(on: MapName, id:number, name:string){
        const m = maps[on]
        if(!m.value.has(id))
            m.value.set(id, name)
    }
    return { userNameMap, userGroupNameMap, ensureLoaded, appendToMap }
})