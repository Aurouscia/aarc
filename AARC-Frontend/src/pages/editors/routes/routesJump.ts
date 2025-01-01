import { RouteLocationRaw } from "vue-router"
import { editorName, editorParamNameSaveId } from "./routesNames"

export const useEditorsRoutesJump = ()=>{
    function editorRoute(saveId:number):RouteLocationRaw{
        return {
            name:editorName,
            params:{
                [editorParamNameSaveId]: saveId
            }
        }
    }
    return { editorRoute }
}