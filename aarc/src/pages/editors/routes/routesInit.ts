import { Router } from "vue-router";
import { addToRouter } from "@/app/router/addToRouter";
import { editorName, editorParamNameSaveId, kickedName } from "./routesNames";
import Editor from "../Editor.vue";
import Kicked from "../Kicked.vue";

export function addEditorsPages(r:Router){
    addToRouter(r, routes);
}

const routes = [
    {
        path:`/Editor/:${editorParamNameSaveId}`,
        props:true,
        component: Editor,
        name:editorName
    },
    {
        path:`/Kicked`,
        component: Kicked,
        name:kickedName
    }
]