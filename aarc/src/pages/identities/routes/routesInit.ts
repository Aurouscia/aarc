import { Router } from "vue-router";
import Login from "../Login.vue";
import Register from "../Register.vue";
import { addToRouter } from "@/app/router/addToRouter";
import { aboutName, loginName, registerName, userCreditName, userHistoriesName, userListName } from "./routesNames";
import UserList from "../UserList.vue";
import About from "../About.vue";
import UserHistories from "../UserHistories.vue";
import UserCredit from "../UserCredit.vue";

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
        path:"/UserHistories",
        component:UserHistories,
        name:userHistoriesName
    },
    {
        path:"/UserCredit",
        component:UserCredit,
        name:userCreditName
    },
    {
        path:"/About",
        component:About,
        name:aboutName
    }
]