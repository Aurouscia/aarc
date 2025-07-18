import { defineStore } from "pinia";
import { useFormalizedLineStore } from '../saveDerived/formalizedLineStore'
import { useStaNameMainRectStore, useStaNameRectStore } from "../saveDerived/staNameRectStore";
import { useTextTagRectStore } from "../saveDerived/textTagRectStore";
import { useLineExtendStore } from "../saveDerived/saveDerivedDerived/lineExtendStore";
import { useCvsBlocksControlStore } from "@/models/cvs/common/cvs";
import { useStaClusterStore } from "../saveDerived/staClusterStore";
import { useEnvStore } from "../envStore";
import { usePointLinkStore } from "../pointLinkStore";
import { useIconStore } from "../iconStore";
import { useDiscardAreaStore } from "../discardAreaStore";
import { useNameEditStore } from "../nameEditStore";
import { useTextTagEditStore } from "../textTagEditStore";

export const useResetterStore = defineStore('resetter', ()=>{
    const envStore = useEnvStore()
    const needClearItemsStoreUses:(()=>{clearItems:()=>void})[] = [
        useFormalizedLineStore,
        useStaNameRectStore,
        useStaNameMainRectStore,
        useTextTagRectStore,
        useLineExtendStore,
        useCvsBlocksControlStore,
        useStaClusterStore,
        usePointLinkStore,
        useIconStore,
        useDiscardAreaStore,
        useNameEditStore,
        useTextTagEditStore
    ]

    function resetDerivedStores(){
        for(const use of needClearItemsStoreUses){
            use().clearItems()
        }
        envStore.endEveryEditing()
        envStore.cancelActive()
        envStore.closeOps()
    }
    return { resetDerivedStores }
})