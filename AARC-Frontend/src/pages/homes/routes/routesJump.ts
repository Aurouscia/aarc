import { RouteLocationRaw } from "vue-router"
import { homePageName } from "./routesNames"

export const useHomesRoutesJump = ()=>{
    function homePageRoute():RouteLocationRaw{
        return {
            name:homePageName
        }
    }
    return { homePageRoute }
}