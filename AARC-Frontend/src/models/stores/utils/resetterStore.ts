import { defineStore } from "pinia";
import { useFormalizedLineStore } from '../saveDerived/formalizedLineStore'
import { useStaClusterStore } from "../saveDerived/staClusterStore";
import { useStaNameRectStore } from "../saveDerived/staNameRectStore";
import { useTextTagRectStore } from "../saveDerived/textTagRectStore";
import { useLineExtendStore } from "../saveDerived/saveDerivedDerived/lineExtendStore";

export const useResetterStore = defineStore('resetter', ()=>{
    const needClearItemsStoreUses:(()=>{clearItems:()=>void})[] = [
        useFormalizedLineStore,
        useStaClusterStore,
        useStaNameRectStore,
        useTextTagRectStore,
        useLineExtendStore
    ]

    function resetDerivedStores(){
        for(const use of needClearItemsStoreUses){
            use().clearItems()
        }
    }
    return { resetDerivedStores }
})