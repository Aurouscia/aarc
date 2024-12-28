import { Router } from "vue-router";
import MySaves from "../MySaves.vue";
import { addToRouter } from "@/app/router/addToRouter";
import { mySavesName } from "./routesNames";

export function addSavesPages(r:Router){
    addToRouter(r, routes);
}

const routes = [
    {
        path:"/Saves/Mine",
        component:MySaves,
        name:mySavesName
    }
]