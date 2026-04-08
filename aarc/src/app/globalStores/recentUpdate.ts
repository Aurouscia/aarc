import { defineStore } from "pinia";
import { ref } from "vue";

const storeId = 'recentUpdate'
export const useRecentUpdateStore = defineStore(storeId,()=>{
    const lastReadTime = ref<string>()
    
    function markAsRead() {
        lastReadTime.value = new Date().toISOString()
    }
    
    return {
        lastReadTime,
        markAsRead
    }
}, {
    persist:{
        key:`aarc-${storeId}`,
        pick: ['lastReadTime']
    }
})
