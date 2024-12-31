import { Router } from "vue-router"
import NotFoundPage from "@/pages/NotFoundPage.vue"
import { addIdentitiesPages } from "@/pages/identities/routes/routesInit"
import { addSavesPages } from "@/pages/saves/routes/routesInit"
import { addEditorsPages } from "@/pages/editors/routes/routesInit"
import { addHomesPages } from "@/pages/homes/routes/routesInit"

export function routerSetup(router:Router){
    router.addRoute({
        path: '/:pathMatch(.*)*',
        component: NotFoundPage
    })
    addHomesPages(router)
    addIdentitiesPages(router)
    addSavesPages(router)
    addEditorsPages(router)
}
