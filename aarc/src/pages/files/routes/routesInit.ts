import { addToRouter } from "@/app/router/addToRouter";
import { Router } from "vue-router";
import UserFileList from "../UserFileList.vue";
import UserFileMarket from "../UserFileMarket.vue";
import { userFileList, userFileMarket } from "./routesNames";

export function addFilesPages(r:Router){
    addToRouter(r, routes);
}

const routes = [
    {
        path: "/UserFiles",
        component: UserFileList,
        name: userFileList
    },
    {
        path: "/UserFiles/Market",
        component: UserFileMarket,
        name: userFileMarket
    }
]