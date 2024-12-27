import { RouteLocationRaw } from "vue-router"
import { mySavesName } from "./routesNames"

export const useIdentitiesRoutesJump = ()=>{
    function mySavesRoute():RouteLocationRaw{
        return {
            name:mySavesName
        }
    }
    return { mySavesRoute }
}