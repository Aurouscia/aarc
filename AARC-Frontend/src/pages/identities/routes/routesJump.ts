import { RouteLocationRaw, useRouter } from "vue-router"
import { loginName, registerName } from "./routesNames"

export const useIdentitiesRoutesJump = ()=>{
    const router = useRouter()
    function loginRoute(backAfterSuccess:boolean = true):RouteLocationRaw{
        return {
            name:loginName,
            params:{
                backAfterSuccess: backAfterSuccess ? 'y' : undefined
            }
        }
    }
    function loginRouteJump(backAfterSuccess:boolean=true){
        router.push(loginRoute(backAfterSuccess))
    }
    function registerRoute():RouteLocationRaw{
        return {
            name:registerName
        }
    }
    return { loginRoute, loginRouteJump, registerRoute }
}