import { Router } from "vue-router";
import Editor from "../Editor.vue";
import { addToRouter } from "@/utils/app/router/addToRouter";
import { editorName } from "./routesNames";

export function addEditorsPages(r:Router){
    addToRouter(r, routes);
}

const routes = [
    {
        path:"/Editor/:saveId",
        props:true,
        component:Editor,
        name:editorName
    }
]