import { homePageName } from "@/pages/homes/routes/routesNames";
import { defineStore } from "pinia";
import { RouteLocationNormalized, useRouter } from "vue-router";

export const useEnteredCanvasFromStore = defineStore('enteredCanvasFrom',()=>{
    const router = useRouter()
    let route:RouteLocationNormalized|undefined = undefined
    function setEnteredFrom(){
        route = router.currentRoute.value
    }
    function goBackToWhereWeEntered(){
        if(route){
            router.push(route)
        }
        else{
            router.push({name: homePageName})
        }
    }
    return {
        setEnteredFrom,
        goBackToWhereWeEntered
    }
})