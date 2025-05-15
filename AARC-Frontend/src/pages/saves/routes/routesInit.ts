import { Router } from "vue-router";
import MySaves from "../MySaves.vue";
import { addToRouter } from "@/app/router/addToRouter";
import { mySavesName, searchSaveName } from "./routesNames";
import SearchSave from "../SearchSave.vue";

export function addSavesPages(r:Router){
    addToRouter(r, routes);
}

const routes = [
    {
        path:"/Saves/Mine/:uid?",
        component:MySaves,
        name:mySavesName,
        props:true
    },
    {
        path:"/Saves/Search/:searchInit?",
        component:SearchSave,
        name:searchSaveName,
        props:true
    }
]