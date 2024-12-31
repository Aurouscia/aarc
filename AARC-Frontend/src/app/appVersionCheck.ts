import { appVersionCheck as check } from "@aurouscia/vite-app-version/check";
import { useUniqueComponentsStore } from "./globalStores/uniqueComponents";

export async function appVersionCheck(){
    const { pop } = useUniqueComponentsStore()
    const res = await check()
    if(!res){
        pop?.show('有版本更新，请刷新浏览器', 'warning')
    }
}