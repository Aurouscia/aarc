import { Router } from "vue-router";
import Editor from "../Editor.vue";
import { addToRouter } from "@/app/router/addToRouter";
import { editorName, editorParamNameSaveId } from "./routesNames";

export function addEditorsPages(r:Router){
    addToRouter(r, routes);
}

const routes = [
    {
        path:`/Editor/:${editorParamNameSaveId}`,
        props:true,
        component:Editor,
        name:editorName
    }
]