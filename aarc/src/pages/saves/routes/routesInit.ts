import { Router } from "vue-router";
import MySaves from "../MySaves.vue";
import { addToRouter } from "@/app/router/addToRouter";
import { mySavesName, saveDiffsName, saveToolsName, searchSaveName } from "./routesNames";
import SearchSave from "../SearchSave.vue";
import SaveTools from "../SaveTools.vue";
import SaveDiffs from "../SaveDiffs.vue";

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
        path:"/Saves/Search",
        component:SearchSave,
        name:searchSaveName
    },
    {
        path:"/Saves/Tools",
        component:SaveTools,
        name:saveToolsName
    },
    {
        path:"/Saves/SaveDiffs",
        component:SaveDiffs,
        name:saveDiffsName
    }
]