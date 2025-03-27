import { Router } from "vue-router"
import NotFoundPage from "@/pages/NotFoundPage.vue"
import { addIdentitiesPages } from "@/pages/identities/routes/routesInit"
import { addSavesPages } from "@/pages/saves/routes/routesInit"
import { addEditorsPages } from "@/pages/editors/routes/routesInit"
import { addHomesPages } from "@/pages/homes/routes/routesInit"
//import { editorName } from "@/pages/editors/routes/routesNames"

export function routerSetup(router:Router){
    router.addRoute({
        path: '/:pathMatch(.*)*',
        component: NotFoundPage
    })
    addHomesPages(router)
    addIdentitiesPages(router)
    addSavesPages(router)
    addEditorsPages(router)
    // router.afterEach((to, from, failure)=>{
    //     if(isNavigationFailure(failure))
    //         return
    //     // if(to.name!==editorName && from.name===editorName){
    //     //     window.location.reload()
    //     // }
    // })
}
