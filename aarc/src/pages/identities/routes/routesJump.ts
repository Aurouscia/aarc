import { RouteLocationRaw, useRouter } from "vue-router"
import { loginName, registerName, userListName } from "./routesNames"

export const useIdentitiesRoutesJump = ()=>{
    const router = useRouter()
    function loginRoute(backAfterSuccess:boolean = true):RouteLocationRaw{
        return {
            name:loginName,
            params:{
                backAfterSuccess: backAfterSuccess ? 'backAfterSuccess' : undefined
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
    function userListRoute(search?:string){
        return {
            name:userListName,
            query:{
                search
            }
        }
    }
    return { loginRoute, loginRouteJump, registerRoute, userListRoute }
}