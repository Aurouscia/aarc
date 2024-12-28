import { Router } from "vue-router"
import NotFoundPage from "@/pages/NotFoundPage.vue"
import { addIdentitiesPages } from "@/pages/identities/routes/routesInit"
import { addSavesPages } from "@/pages/saves/routes/routesInit"
import { addEditorsPages } from "@/pages/editors/routes/routesInit"

export function routerSetup(router:Router){
    router.addRoute({
        path: '/:pathMatch(.*)*',
        component: NotFoundPage
    })
    addIdentitiesPages(router)
    addSavesPages(router)
    addEditorsPages(router)
}
