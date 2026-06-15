import { homePageName } from "@/pages/homes/routes/routesNames";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";

const storeId = 'enteredCanvasFrom'
export const useEnteredCanvasFromStore = defineStore(storeId,()=>{
    const router = useRouter()
    const route = ref<string>()
    /** 是否已在来源页面查看过Comment弹窗（warn/rule），不持久化 */
    const commentPromptChecked = ref(false)
    function setEnteredFrom(){
        route.value = router.currentRoute.value.fullPath
        commentPromptChecked.value = false
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
        commentPromptChecked,
        setEnteredFrom,
        goBackToWhereWeEntered
    }
}, {
    persist:{
        key:`aarc-${storeId}`,
        pick: ['route']
    }
})