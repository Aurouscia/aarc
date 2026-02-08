import { appVersionCheck as check } from "@aurouscia/vite-app-version/check";
import { useUniqueComponentsStore } from "./globalStores/uniqueComponents";

export async function appVersionCheck(){
    const { showPop } = useUniqueComponentsStore()
    const res = await check()
    if(!res){
        showPop('版本更新\n为您刷新浏览器', 'warning')
        window.setTimeout(()=>{
            window.location.reload()
        }, 1000)
    }
}