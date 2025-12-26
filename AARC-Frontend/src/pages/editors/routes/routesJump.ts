import { RouteLocationRaw } from "vue-router"
import { editorName, editorParamNameSaveId, editorParamViewOnly } from "./routesNames"

export const useEditorsRoutesJump = ()=>{
    function editorRoute(saveId:number, options?:{viewOnly?:boolean}):RouteLocationRaw{
        return {
            name:editorName,
            params:{
                [editorParamNameSaveId]: saveId
            },
            query:{
                [editorParamViewOnly]: options?.viewOnly ? 1 : undefined
            }
        }
    }
    return { editorRoute }
}