import { defineStore } from "pinia";
import { useFormalizedLineStore } from '../saveDerived/formalizedLineStore'
import { useStaClusterStore } from "../saveDerived/staClusterStore";
import { useStaNameRectStore } from "../saveDerived/staNameRectStore";
import { useTextTagRectStore } from "../saveDerived/textTagRectStore";
import { useLineExtendStore } from "../saveDerived/saveDerivedDerived/lineExtendStore";
import { useCvsBlocksControlStore } from "@/models/cvs/common/cvs";

//目前已经弃用，改为每次退出画布时自动刷新页面一次
//TODO：有时刷新会触发两次同样的http请求的问题
export const useResetterStore = defineStore('resetter', ()=>{
    const needClearItemsStoreUses:(()=>{clearItems:()=>void})[] = [
        useFormalizedLineStore,
        useStaClusterStore,
        useStaNameRectStore,
        useTextTagRectStore,
        useLineExtendStore,
        useCvsBlocksControlStore
    ]

    function resetDerivedStores(){
        for(const use of needClearItemsStoreUses){
            use().clearItems()
        }
    }
    return { resetDerivedStores }
})