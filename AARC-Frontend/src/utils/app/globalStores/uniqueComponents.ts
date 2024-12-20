import { defineStore } from "pinia";
import Pop from "@/components/common/Pop.vue";
import Wait from "@/components/common/Wait.vue";
import { ref } from "vue";

export const useUniqueComponentsStore = defineStore('uniqueComponents', ()=>{
    const pop = ref<InstanceType<typeof Pop>>()
    const wait = ref<InstanceType<typeof Wait>>()
    return { pop, wait }
})