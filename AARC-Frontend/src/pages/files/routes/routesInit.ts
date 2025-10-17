import { addToRouter } from "@/app/router/addToRouter";
import { Router } from "vue-router";
import UserFileList from "../UserFileList.vue";
import { userFileList } from "./routesNames";

export function addFilesPages(r:Router){
    addToRouter(r, routes);
}

const routes = [
    {
        path: "/UserFiles",
        component: UserFileList,
        name: userFileList
    }
]