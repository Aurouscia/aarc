import { RouteLocationRaw } from "vue-router"
import { mySavesName } from "./routesNames"

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
    return { mySavesRoute, someonesSavesRoute }
}