import { defineStore } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";

export const usePreventLeavingUnsavedStore = defineStore('preventLeavingUnsaved', ()=>{
    const router = useRouter();
    const preventingLeaving = ref<boolean>(false);
    const showUnsavedWarning = ref<boolean>(false);
    function leavingHandler(){
        return "未保存"
    }
    let removeRouteGuard:(()=>void)|undefined;
    
    function preventLeaving(){
        if(preventingLeaving.value){
            return;
        }
        console.log("限制离开")
        window.onbeforeunload = leavingHandler
        removeRouteGuard = router.beforeEach(()=>{
            showUnsavedWarning.value = true;
            return false;
        });
        preventingLeaving.value = true;
    }
    function releasePreventLeaving(){
        if(!preventingLeaving.value){
            return;
        }
        console.log("解除限制离开")
        window.onbeforeunload = null
        if(removeRouteGuard){
            removeRouteGuard()
            removeRouteGuard = undefined;
        }
        preventingLeaving.value = false;
    }
    return { preventLeaving, releasePreventLeaving, preventingLeaving, showUnsavedWarning }
})