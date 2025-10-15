import { Router } from "vue-router";
import { addToRouter } from "@/app/router/addToRouter";
import { editorName, editorParamNameSaveId } from "./routesNames";

export function addEditorsPages(r:Router){
    addToRouter(r, routes);
}

const routes = [
    {
        path:`/Editor/:${editorParamNameSaveId}`,
        props:true,
        component: ()=>import("../Editor.vue"),
        name:editorName
    }
]