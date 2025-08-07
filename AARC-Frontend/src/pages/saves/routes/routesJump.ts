import { RouteLocationRaw } from "vue-router"
import { mySavesName, searchSaveName } from "./routesNames"

export const useSavesRoutesJump = ()=>{
    function mySavesRoute():RouteLocationRaw{
        return {
            name:mySavesName
        }
    }
    function someonesSavesRoute(uid:number):RouteLocationRaw{
        return {
            name:mySavesName,
            params:{
                uid 
            }
        }
    }
    function searchSaveRoute(search?:string, orderby?:string):RouteLocationRaw{
        return {
            name:searchSaveName,
            query:{
                s:search,
                o:orderby
            }
        }
    }
    return { mySavesRoute, someonesSavesRoute, searchSaveRoute }
}