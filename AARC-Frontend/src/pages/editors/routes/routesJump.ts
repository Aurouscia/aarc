import { RouteLocationRaw } from "vue-router"
import { editorName } from "./routesNames"

export const useEditorsRoutesJump = ()=>{
    function editorRoute(saveId:number):RouteLocationRaw{
        return {
            name:editorName,
            params:{
                saveId
            }
        }
    }
    return { editorRoute }
}