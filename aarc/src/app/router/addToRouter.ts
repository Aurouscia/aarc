import {RouteRecordRaw, Router} from 'vue-router'

export function addToRouter(router:Router, routes:Array<RouteRecordRaw>){
    routes.forEach(x=>{
        router.addRoute(x);
    })
} 
