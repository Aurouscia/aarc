import { Router } from "vue-router";
import Login from "../Login.vue";
import Register from "../Register.vue";
import { addToRouter } from "@/utils/app/router/addToRouter";
import { loginName, registerName } from "./routesNames";

export function addIdentitiesPages(r:Router){
    addToRouter(r, routes);
}

const routes = [
    {
        path:"/Login/:backAfterSuccess?",
        component:Login,
        props:true,
        name:loginName
    },
    {
        path:"/Register",
        component:Register,
        name:registerName
    }
]