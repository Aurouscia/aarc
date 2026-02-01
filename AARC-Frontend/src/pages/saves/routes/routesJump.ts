import { RouteLocationRaw } from "vue-router"
import { mySavesName, saveDiffsName, searchSaveName } from "./routesNames"

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
    function saveDiffsRoute(saveId?:number, userId?:number){
        return {
            name:saveDiffsName,
            query:{
                saveId,
                userId
            }
        }
    }
    return { mySavesRoute, someonesSavesRoute, searchSaveRoute, saveDiffsRoute }
}