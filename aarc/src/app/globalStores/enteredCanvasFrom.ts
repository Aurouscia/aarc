import { homePageName } from "@/pages/homes/routes/routesNames";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";

const storeId = 'enteredCanvasFrom'
export const useEnteredCanvasFromStore = defineStore(storeId,()=>{
    const router = useRouter()
    const route = ref<string>()
    function setEnteredFrom(){
        route.value = router.currentRoute.value.fullPath
    }
    function goBackToWhereWeEntered(){
        if(route.value){
            router.push(route.value)
        }
        else{
            router.push({name: homePageName})
        }
    }
    return {
        route,
        setEnteredFrom,
        goBackToWhereWeEntered
    }
}, {
    persist:{
        key:`aarc-${storeId}`,
        pick: ['route']
    }
})