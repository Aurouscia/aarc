import { Router } from "vue-router"
import NotFoundPage from "@/pages/NotFoundPage.vue"
import { addIdentities } from "@/pages/identities/routes/routesInit"

export function routerSetup(router:Router){
    router.addRoute({
        path: '/:pathMatch(.*)*',
        component: NotFoundPage
    })
    addIdentities(router)
}
