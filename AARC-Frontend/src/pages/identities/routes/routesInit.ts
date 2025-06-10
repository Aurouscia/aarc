import { Router } from "vue-router";
import Login from "../Login.vue";
import Register from "../Register.vue";
import { addToRouter } from "@/app/router/addToRouter";
import { aboutName, loginName, registerName, userListName } from "./routesNames";
import UserList from "../UserList.vue";
import About from "../About.vue";

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
    },
    {
        path:"/UserList",
        component:UserList,
        name:userListName
    },
    {
        path:"/About",
        component:About,
        name:aboutName
    }
]