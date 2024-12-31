import { Router } from "vue-router";
import HomePage from "../HomePage.vue";
import { addToRouter } from "@/app/router/addToRouter";
import { homePageName } from "./routesNames";

export function addHomesPages(r:Router){
    addToRouter(r, routes);
}

const routes = [
    {
        path:"/",
        component:HomePage,
        name:homePageName
    }
]