import { homePageName } from "@/pages/homes/routes/routesNames";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";

const storeId = 'enteredCanvasFrom'
const commentPromptExpireMs = 60 * 1000

export const useEnteredCanvasFromStore = defineStore(storeId,()=>{
    const router = useRouter()
    const route = ref<string>()
    /** 记录每个存档Id的"已查看Comment弹窗"时间戳，过期60秒 */
    const commentPromptChecked = ref<Record<number, number>>({})

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

    function markCommentPromptChecked(saveId: number){
        commentPromptChecked.value[saveId] = Date.now()
    }

    function isCommentPromptChecked(saveId: number): boolean{
        const now = Date.now()
        const record = commentPromptChecked.value
        // 先移除所有过期项目
        for(const id in record){
            if(now - record[id] > commentPromptExpireMs){
                delete record[id]
            }
        }
        // 再判断当前存档是否在里面
        return !!record[saveId]
    }

    return {
        route,
        commentPromptChecked,
        setEnteredFrom,
        goBackToWhereWeEntered,
        markCommentPromptChecked,
        isCommentPromptChecked
    }
}, {
    persist:{
        key:`aarc-${storeId}`,
        pick: ['route', 'commentPromptChecked']
    }
})
